# 🚀 GitHub Profile README Generator

An AI-powered web application that automatically generates stunning GitHub profile READMEs using Azure OpenAI GPT-4. Simply enter a GitHub username and get a professionally crafted README with personalized insights, tech stack analysis, and beautiful formatting.

![Profile README Generator](https://img.shields.io/badge/AI%20Powered-Azure%20GPT--4-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-green?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.0+-red?style=for-the-badge&logo=flask)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)

## ✨ Features

- **🤖 AI-Powered Generation**: Leverages Azure OpenAI GPT-4 for intelligent content creation
- **📊 Smart Analysis**: Analyzes GitHub repositories, languages, and coding patterns
- **🎨 Beautiful Design**: Modern, GitHub-themed dark UI with smooth animations
- **⚡ Real-time Preview**: Live markdown preview with syntax highlighting
- **📋 One-Click Copy**: Easy clipboard integration for generated content
- **💾 Download Support**: Export README as .md file
- **🔄 Caching System**: Optimized API calls with intelligent caching
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices

## 🏗️ Architecture

```
ProfileReadme/
├── backend/                 # Flask API server
│   ├── app.py              # Main Flask application
│   ├── generator.py        # AI generation & GitHub API logic
│   ├── .env               # Environment variables
│   └── .gitignore         # Git ignore rules
└── frontend/               # Static web interface
    ├── index.html         # Main HTML structure
    ├── script.js          # Frontend JavaScript logic
    └── style.css          # Modern GitHub-themed styling
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Azure OpenAI account with GPT-4 access
- GitHub Personal Access Token
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pranesh-2005/Profile_Readme_Generator.git
   cd Profile_Readme_Generator
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   AZURE_OPENAI_KEY=your_azure_openai_key
   AZURE_OPENAI_ENDPOINT=your_azure_endpoint
   AZURE_DEPLOYMENT_NAME=gpt-4
   GITHUB_TOKEN=your_github_token
   ```

4. **Start the Flask server**
   ```bash
   python app.py
   ```

5. **Open the frontend**
   Open [`frontend/index.html`](frontend/index.html) in your browser or serve it with a local server.

## 📖 Usage

1. **Enter Username**: Type any GitHub username in the input field
2. **Generate**: Click the "Generate README" button
3. **Review**: Switch between Raw Markdown and Live Preview tabs
4. **Copy/Download**: Use the convenient buttons to copy or download your README

### Example API Usage

```javascript
// Generate README for a user
const response = await fetch('http://localhost:5000/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'octocat' })
});

const data = await response.json();
console.log(data.readme); // Generated README content
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_KEY` | Your Azure OpenAI API key | ✅ |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | ✅ |
| `AZURE_DEPLOYMENT_NAME` | GPT model deployment name | ✅ |
| `GITHUB_TOKEN` | GitHub personal access token | ✅ |
| `PORT` | Server port (default: 5000) | ❌ |
| `DEBUG` | Enable debug mode | ❌ |

### GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `public_repo` scope
3. Add it to your `.env` file

## 🎨 Features Deep Dive

### AI-Powered Content Generation

The [`generate_readme`](backend/generator.py) function uses advanced prompting techniques to create personalized READMEs:

- **Profile Analysis**: Extracts user bio, location, company, and social links
- **Repository Intelligence**: Analyzes coding patterns, popular languages, and project topics
- **Smart Ranking**: Identifies featured repositories based on stars, forks, and activity
- **Contextual Adaptation**: Adjusts tone and content based on user's experience level

### Caching & Performance

- **5-minute cache** for GitHub API responses
- **Concurrent data fetching** using ThreadPoolExecutor
- **Automatic cache cleanup** with background threads
- **Optimized API calls** with request batching

### Frontend Features

- **Modern UI**: GitHub-inspired design with CSS custom properties
- **Tab System**: Switch between raw markdown and live preview
- **Notification System**: Toast notifications for user feedback
- **Error Handling**: Comprehensive error states and fallbacks
- **Loading States**: Visual feedback during generation

## 🔌 API Endpoints

### `POST /generate`
Generate a README for a GitHub user.

**Request:**
```json
{
  "username": "github_username"
}
```

**Response:**
```json
{
  "readme": "Generated README content",
  "generation_time": 2.34,
  "cached": false,
  "username": "github_username"
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1640995200,
  "cache_size": 42
}
```

## 🛠️ Development

### Running in Development Mode

```bash
# Backend with auto-reload
cd backend
export DEBUG=true
python app.py

# Frontend with live server (using Python)
cd frontend
python -m http.server 8000
```

### Code Structure

- **[`app.py`](backend/app.py)**: Flask application with CORS, error handling, and API routes
- **[`generator.py`](backend/generator.py)**: Core logic for GitHub API integration and AI generation
- **[`script.js`](frontend/script.js)**: Frontend JavaScript with modern ES6+ features
- **[`style.css`](frontend/style.css)**: Responsive CSS with custom properties and animations

## 📦 Dependencies

### Backend
- `flask` - Web framework
- `flask-cors` - Cross-origin resource sharing
- `openai` - Azure OpenAI client
- `requests` - HTTP library
- `python-dotenv` - Environment variable management

### Frontend
- `marked.js` - Markdown parsing (CDN)
- `github-markdown-css` - GitHub-style markdown rendering (CDN)

## 🚀 Deployment

### Local Production
```bash
# Set production environment
export DEBUG=false
export PORT=5000

# Run with gunicorn (recommended)
pip install gunicorn
gunicorn --bind 0.0.0.0:5000 app:app
```

### Docker (Optional)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

- Environment variables are properly isolated
- GitHub tokens are securely handled
- Input validation prevents malicious requests
- CORS is configured for security

## 📊 Performance

- **Average generation time**: 2-5 seconds
- **Cache hit rate**: ~80% for repeated requests
- **API rate limiting**: Respects GitHub API limits
- **Memory usage**: Optimized with LRU caching

## 🙏 Acknowledgments

- **Azure OpenAI** for providing powerful GPT-4 capabilities
- **GitHub API** for comprehensive repository data
- **Vercel** for GitHub stats widgets
- **Shields.io** for beautiful badges

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/pranesh-2005/Profile_Readme_Generator/issues) page
2. Create a new issue with detailed information
3. Include error logs and reproduction steps

---

<div align="center">

**Made with ❤️ and Azure GPT-4**

</div>