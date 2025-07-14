import os, base64, requests, asyncio, aiohttp
from dotenv import load_dotenv
from openai import AzureOpenAI
from functools import lru_cache
import time
from concurrent.futures import ThreadPoolExecutor
import json

load_dotenv()                                      # load .env locally; in Azure use App Settings

GITHUB_TOKEN         = os.getenv("GITHUB_TOKEN")
AZURE_ENDPOINT       = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_KEY            = os.getenv("AZURE_OPENAI_KEY")
AZURE_DEPLOYMENT     = os.getenv("AZURE_DEPLOYMENT_NAME")

# Add validation for required environment variables
if not AZURE_KEY:
    raise ValueError("AZURE_OPENAI_KEY environment variable is required")
if not AZURE_ENDPOINT:
    raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is required")
if not AZURE_DEPLOYMENT:
    raise ValueError("AZURE_DEPLOYMENT_NAME environment variable is required")

client = AzureOpenAI(                             # GPT‑4.1 chat interface
    azure_endpoint = AZURE_ENDPOINT,
    api_key        = AZURE_KEY,
    api_version    = "2024-12-01-preview",
)

# Cache for user data (expires after 5 minutes)
user_cache = {}
CACHE_DURATION = 300  # 5 minutes

def is_cache_valid(timestamp):
    return time.time() - timestamp < CACHE_DURATION

@lru_cache(maxsize=100)
def get_github_headers():
    """Cached headers for GitHub API."""
    return {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "ProfileReadmeGenerator/1.0"
    }

def fetch_user_profile(user: str) -> dict:
    """Fetch user profile information."""
    cache_key = f"profile_{user}"
    
    if cache_key in user_cache:
        cached_data, timestamp = user_cache[cache_key]
        if is_cache_valid(timestamp):
            return cached_data
    
    url = f"https://api.github.com/users/{user}"
    headers = get_github_headers()
    
    try:
        r = requests.get(url, headers=headers, timeout=5)
        if not r.ok:
            return {}
        
        profile = r.json()
        profile_data = {
            "name": profile.get("name", user),
            "bio": profile.get("bio", ""),
            "location": profile.get("location", ""),
            "company": profile.get("company", ""),
            "blog": profile.get("blog", ""),
            "twitter": profile.get("twitter_username", ""),
            "followers": profile.get("followers", 0),
            "following": profile.get("following", 0),
            "public_repos": profile.get("public_repos", 0),
            "created_at": profile.get("created_at", ""),
        }
        
        user_cache[cache_key] = (profile_data, time.time())
        return profile_data
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return {}

def analyze_coding_patterns(repos: list) -> dict:
    """Analyze coding patterns from repositories."""
    languages = {}
    topics = set()
    total_stars = 0
    active_repos = 0
    
    for repo in repos:
        # Count languages
        if repo.get("language"):
            languages[repo["language"]] = languages.get(repo["language"], 0) + 1
        
        # Collect topics
        for topic in repo.get("topics", []):
            topics.add(topic)
        
        # Count stars and activity
        total_stars += repo.get("stars", 0)
        if repo.get("stars", 0) > 0 or repo.get("forks", 0) > 0:
            active_repos += 1
    
    # Sort languages by frequency
    top_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "top_languages": top_languages,
        "topics": list(topics)[:10],
        "total_stars": total_stars,
        "active_repos": active_repos,
        "primary_language": top_languages[0][0] if top_languages else "Unknown"
    }

def fetch_user_repos_fast(user: str) -> list:
    """Optimized version with caching and reduced API calls."""
    cache_key = f"repos_{user}"
    
    # Check cache first
    if cache_key in user_cache:
        cached_data, timestamp = user_cache[cache_key]
        if is_cache_valid(timestamp):
            return cached_data
    
    url = f"https://api.github.com/users/{user}/repos"
    headers = get_github_headers()
    params = {
        "sort": "updated",
        "per_page": 30,  # Increased for better analysis
        "type": "owner"
    }
    
    try:
        r = requests.get(url, headers=headers, params=params, timeout=5)
        if not r.ok:
            return []
        
        repos = r.json()
        repo_list = []
        for repo in repos[:15]:  # Analyze more repos for better insights
            if not repo.get('fork', False):
                repo_data = {
                    "name": repo["name"],
                    "description": repo.get("description", ""),
                    "html_url": repo["html_url"],
                    "language": repo.get("language", ""),
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                    "topics": repo.get("topics", []),
                    "updated_at": repo.get("updated_at", ""),
                    "size": repo.get("size", 0),
                    "default_branch": repo.get("default_branch", "main")
                }
                repo_list.append(repo_data)
        
        user_cache[cache_key] = (repo_list, time.time())
        return repo_list
        
    except Exception as e:
        print(f"Error fetching repos: {e}")
        return []

def fetch_profile_readme_fast(user: str) -> str:
    """Optimized version with caching."""
    cache_key = f"readme_{user}"
    
    if cache_key in user_cache:
        cached_data, timestamp = user_cache[cache_key]
        if is_cache_valid(timestamp):
            return cached_data
    
    url = f"https://api.github.com/repos/{user}/{user}/readme"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.raw",
        "User-Agent": "ProfileReadmeGenerator/1.0"
    }
    
    try:
        r = requests.get(url, headers=headers, timeout=3)
        result = r.text if r.ok else ""
        
        user_cache[cache_key] = (result, time.time())
        return result
    except Exception as e:
        print(f"Error fetching README: {e}")
        return ""

def fetch_user_data_concurrent(user: str):
    """Fetch profile, repos and README concurrently."""
    with ThreadPoolExecutor(max_workers=3) as executor:
        profile_future = executor.submit(fetch_user_profile, user)
        repos_future = executor.submit(fetch_user_repos_fast, user)
        readme_future = executor.submit(fetch_profile_readme_fast, user)
        
        profile = profile_future.result()
        repos = repos_future.result()
        existing_readme = readme_future.result()
        
        return profile, repos, existing_readme

# ...existing code...

def generate_readme(existing_md: str, user: str) -> str:
    """Generate an excellent GitHub profile README with enhanced AI prompting."""
    
    # Fetch comprehensive user data
    profile, repos, _ = fetch_user_data_concurrent(user)
    
    # Analyze coding patterns
    analysis = analyze_coding_patterns(repos)
    
    # Select best repositories based on multiple criteria
    featured_repos = sorted(repos, key=lambda x: (
        x.get("stars", 0) * 3 +  # Weight stars heavily
        x.get("forks", 0) * 2 +  # Weight forks moderately
        len(x.get("topics", [])) * 1 +  # Bonus for topics
        (1 if x.get("description") else 0) * 2  # Bonus for description
    ), reverse=True)[:4]
    
    # Create rich context for AI with safe data handling
    user_context = {
        "username": user,
        "display_name": profile.get("name") or user,
        "bio": profile.get("bio") or "",
        "location": profile.get("location") or "",
        "company": profile.get("company") or "",
        "blog": profile.get("blog") or "",
        "twitter": profile.get("twitter") or "",
        "stats": {
            "followers": profile.get("followers", 0),
            "repos": profile.get("public_repos", 0),
            "total_stars": analysis["total_stars"],
            "active_repos": analysis["active_repos"]
        },
        "languages": analysis["top_languages"],
        "primary_language": analysis["primary_language"],
        "topics": analysis["topics"],
        "featured_repositories": featured_repos
    }
    
    # Enhanced system prompt
    system_prompt = """You are an elite GitHub profile README architect and technical storyteller. Your expertise lies in:

1. **Technical Analysis**: Deep understanding of programming languages, frameworks, and development patterns
2. **Personal Branding**: Creating compelling developer narratives that stand out in the tech community
3. **Visual Design**: Crafting aesthetically pleasing, well-structured markdown with strategic use of badges, stats, and visual elements
4. **Industry Awareness**: Knowledge of current tech trends, popular tools, and what impresses hiring managers and collaborators

Your mission: Transform raw GitHub data into a captivating professional profile that tells a story, showcases expertise, and creates meaningful connections.

Guidelines:
- Output clean markdown only (no code fences)
- Balance professionalism with personality
- Use strategic visual elements (badges, stats widgets, etc.)
- Create scannable content with clear sections
- Include subtle call-to-actions for collaboration
- Adapt tone based on the developer's apparent experience level and focus areas"""

    # Safe repository info formatting
    repo_info = ""
    if user_context['featured_repositories']:
        repo_info = "\n\nFeatured Repositories:\n"
        for repo in user_context['featured_repositories']:
            desc = repo.get('description') or 'No description available'
            desc_truncated = desc[:80] + ('...' if len(desc) > 80 else '')
            language = repo.get('language') or 'Unknown'
            stars = repo.get('stars', 0)
            forks = repo.get('forks', 0)
            repo_info += f"• **{repo['name']}**: {desc_truncated} [{language}] ({stars} ⭐, {forks} 🍴)\n"

    # Comprehensive user prompt with safe string formatting
    user_prompt = f"""
Create an exceptional GitHub profile README for: **{user_context['username']}**

# USER INTELLIGENCE:
## Profile Overview:
- **Name**: {user_context['display_name']}
- **Bio**: {user_context['bio'] or 'Not specified'}
- **Location**: {user_context['location'] or 'Unknown'}
- **Company**: {user_context['company'] or 'Independent'}
- **Website**: {user_context['blog'] or 'None'}
- **Social**: {'@' + user_context['twitter'] if user_context['twitter'] else 'None'}

## GitHub Metrics:
- **Public Repositories**: {user_context['stats']['repos']}
- **Total Stars Earned**: {user_context['stats']['total_stars']}
- **Followers**: {user_context['stats']['followers']}
- **Active Projects**: {user_context['stats']['active_repos']}

## Technical Profile:
- **Primary Language**: {user_context['primary_language']}
- **Language Distribution**: {', '.join([f"{lang} ({count} repos)" for lang, count in user_context['languages'][:3]]) if user_context['languages'] else 'Various languages'}
- **Focus Areas**: {', '.join(user_context['topics'][:8]) if user_context['topics'] else 'Diverse development'}

{repo_info}

# EXISTING README:
{existing_md[:300] if existing_md else 'No existing README found'}

# CREATION REQUIREMENTS:

## Essential Sections:
1. **Hero Section**: Eye-catching header with name, title, and brief value proposition
2. **About Me**: Compelling 2-3 sentence summary highlighting unique strengths and interests
3. **Tech Stack**: Visually appealing skill showcase with relevant badges/icons
4. **Featured Projects**: 2-3 standout repositories with descriptions, tech used, and impact
5. **GitHub Activity**: Stats widgets and contribution visualization
6. **Connect**: Professional networking call-to-action

## Style & Tone Guidelines:
- **Professional yet approachable**: Balance technical expertise with human personality
- **Achievement-focused**: Highlight concrete accomplishments and impacts
- **Forward-looking**: Express enthusiasm for learning and collaboration
- **Industry-relevant**: Use appropriate technical terminology and current trends
- **Visually engaging**: Strategic use of emojis, badges, and formatting

## Technical Requirements:
- Include GitHub stats: `github-readme-stats.vercel.app/api?username={user_context['username']}`
- Add language stats: `github-readme-stats.vercel.app/api/top-langs/?username={user_context['username']}`
- Use shields.io badges for technologies
- Implement proper markdown hierarchy and spacing
- Ensure mobile-friendly formatting

## Personalization Instructions:
- Adapt content depth to apparent experience level (junior/mid/senior)
- Emphasize the strongest technical areas based on repository analysis
- Include relevant contact methods based on available profile information
- Tailor the tone to match the primary programming domain (web dev, data science, mobile, etc.)

Create a README that makes {user_context['display_name'] or user_context['username']} stand out as a skilled, collaborative, and passionate developer worth connecting with.
"""

    try:
        resp = client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.75,  # Slightly higher for more creativity
            max_tokens=10000,   # Increased for comprehensive output
            timeout=20
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating README: {e}")
        return generate_fallback_readme(user_context)

# ...existing code...
def generate_fallback_readme(user_context: dict) -> str:
    """Generate a high-quality fallback README when AI fails."""
    name = user_context.get('display_name', user_context['username'])
    username = user_context['username']
    primary_lang = user_context.get('primary_language', 'Code')
    
    return f"""# Hi there, I'm {name} 👋

## 🚀 About Me
I'm a passionate developer focused on {primary_lang} and building innovative solutions. Welcome to my GitHub profile where I share my coding journey and projects!

## 🛠️ Tech Stack
- **Primary**: {primary_lang}
- **Languages**: {', '.join([lang for lang, _ in user_context.get('languages', [])[:4]])}

## 📈 GitHub Stats
![GitHub Stats](https://github-readme-stats.vercel.app/api?username={username}&theme=dark&show_icons=true&hide_border=true)

![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username={username}&theme=dark&layout=compact&hide_border=true)

## 🤝 Connect With Me
Feel free to reach out for collaborations or just a friendly chat about technology!

---
⭐️ From [{username}](https://github.com/{username})
"""

# Clean up old cache entries periodically
def cleanup_cache():
    """Remove expired cache entries."""
    current_time = time.time()
    expired_keys = [
        key for key, (_, timestamp) in user_cache.items()
        if current_time - timestamp > CACHE_DURATION
    ]
    for key in expired_keys:
        del user_cache[key]

# Legacy function for backward compatibility
def fetch_profile_readme(user: str) -> str:
    return fetch_profile_readme_fast(user)