# Watch What - Movie Voting System

A real-time movie voting application built with FastAPI, SQLAlchemy, and Pydantic. Users can create voting sessions, submit movies, and vote to determine which movie to watch next.

## 🎬 Features

- **Session Management**: Create unique voting sessions with 6-character codes
- **Movie Submissions**: Participants can submit movies for consideration
- **Multi-Round Voting**: Vote for multiple movies per round
- **Elimination System**: Movies with the least votes are eliminated each round
- **Winner Tracking**: Automatic winner detection when only one movie remains
- **Real-time Status**: Track session progress and voting results
- **RESTful API**: Complete API for frontend integration

## 🏗️ Architecture

- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **Validation**: Pydantic schemas for request/response validation
- **Containerization**: Docker Compose for easy deployment

## 📋 Prerequisites

- Python 3.8+
- pip
- Docker (optional, for containerized deployment)

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/adalman/watch-what.git
   cd watch-what
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

4. **Run the application**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Alternative Docs: http://localhost:8000/redoc

### Option 2: Docker Deployment

1. **Clone and run with Docker Compose**
   ```bash
   git clone https://github.com/adalman/watch-what.git
   cd watch-what
   docker-compose up -d
   ```

2. **Access the application**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs

## 📚 API Documentation

### Core Endpoints

#### Sessions
- `POST /sessions/` - Create a new voting session
- `GET /sessions/{session_id}` - Get session details
- `GET /sessions/code/{session_code}` - Get session by code
- `PUT /sessions/{session_id}/status` - Update session status
- `POST /sessions/{session_id}/next-round` - Advance to next round

#### Participants
- `POST /sessions/{session_id}/participants/` - Add participant
- `GET /sessions/{session_id}/participants/` - List participants
- `PUT /participants/{participant_id}` - Update participant

#### Movies
- `POST /sessions/{session_id}/movies/` - Submit a movie
- `GET /sessions/{session_id}/movies/` - List movies
- `GET /sessions/{session_id}/movies/active` - List active movies

#### Voting
- `POST /sessions/{session_id}/votes/` - Cast a vote
- `GET /sessions/{session_id}/votes/round/{round}` - Get round results
- `GET /sessions/{session_id}/votes/` - List all votes

#### Status
- `GET /sessions/{session_id}/status` - Get session status summary

### Example Usage

#### 1. Create a Voting Session
```bash
curl -X POST "http://localhost:8000/sessions/" \
  -H "Content-Type: application/json" \
  -d '{"status": "submission", "current_round": 1}'
```

#### 2. Add Participants
```bash
curl -X POST "http://localhost:8000/sessions/1/participants/" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "session_id": 1}'
```

#### 3. Submit Movies
```bash
curl -X POST "http://localhost:8000/sessions/1/movies/" \
  -H "Content-Type: application/json" \
  -d '{"title": "Inception", "session_id": 1, "submitted_by_participant_id": 1}'
```

#### 4. Start Voting
```bash
curl -X PUT "http://localhost:8000/sessions/1/status?status=voting"
```

#### 5. Cast Votes
```bash
curl -X POST "http://localhost:8000/sessions/1/votes/" \
  -H "Content-Type: application/json" \
  -d '{"movie_id": 1, "round": 1, "participant_id": 1, "session_id": 1}'
```

#### 6. Advance to Next Round
```bash
curl -X POST "http://localhost:8000/sessions/1/next-round"
```

## 🗄️ Database Schema

### Core Models

#### Session
- `id`: Primary key
- `code`: Unique 6-character session code
- `status`: Current status (submission, voting, finished)
- `current_round`: Current voting round number
- `winner_movie_id`: ID of winning movie (when finished)
- `created_at`: Session creation timestamp

#### Participant
- `id`: Primary key
- `name`: Participant name
- `session_id`: Foreign key to Session
- `created_at`: Participant creation timestamp

#### Movie
- `id`: Primary key
- `title`: Movie title
- `session_id`: Foreign key to Session
- `submitted_by_participant_id`: Foreign key to Participant
- `eliminated_round`: Round when movie was eliminated (null if active)
- `created_at`: Movie creation timestamp

#### Vote
- `id`: Primary key
- `movie_id`: Foreign key to Movie
- `participant_id`: Foreign key to Participant
- `session_id`: Foreign key to Session
- `round`: Voting round number
- `created_at`: Vote creation timestamp

## 🎯 Voting Logic

### How It Works

1. **Submission Phase**: Participants join and submit movies
2. **Voting Phase**: Participants vote for multiple movies per round
3. **Elimination**: Movies with the least votes are eliminated
4. **Advancement**: Movies with the most votes advance to the next round
5. **Winner**: When only one movie remains, it becomes the winner

### Key Rules

- Participants can vote for multiple movies per round
- Movies with 0 votes are eliminated
- Movies with the same vote count are not eliminated (tie protection)
- Session finishes when only one movie remains active

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=sqlite:///./watch_what.db
SECRET_KEY=your-secret-key-here
DEBUG=True
```

### Database URLs

- **SQLite (Development)**: `sqlite:///./watch_what.db`
- **PostgreSQL (Production)**: `postgresql://user:password@localhost/watch_what`

## 🧪 Testing

### Manual Testing

1. **Start the server**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Test the API**
   - Visit http://localhost:8000/docs for interactive API testing
   - Use the curl examples above for command-line testing

### Example Test Scenario

```bash
# Create session
SESSION_ID=$(curl -s -X POST "http://localhost:8000/sessions/" \
  -H "Content-Type: application/json" \
  -d '{"status": "submission", "current_round": 1}' | jq -r '.id')

# Add participants
curl -X POST "http://localhost:8000/sessions/$SESSION_ID/participants/" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "session_id": '$SESSION_ID'}'

# Submit movies and vote...
```

## 🚀 Deployment

### Production Considerations

1. **Database**: Use PostgreSQL instead of SQLite
2. **Environment**: Set `DEBUG=False` in production
3. **Security**: Use strong `SECRET_KEY`
4. **HTTPS**: Configure SSL/TLS certificates
5. **Load Balancing**: Consider using multiple instances

### Docker Production

```bash
# Build production image
docker build -t watch-what:latest .

# Run with environment variables
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/watch_what \
  -e SECRET_KEY=your-secret-key \
  watch-what:latest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the API docs at `/docs` when running locally
- **Questions**: Open a GitHub discussion for general questions

## 🔮 Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Frontend web application
- [ ] Mobile app
- [ ] Advanced voting algorithms
- [ ] Movie metadata integration (IMDb, TMDB)
- [ ] User authentication and profiles
- [ ] Session templates and presets
- [ ] Analytics and voting history

---

**Made with ❤️ for movie lovers everywhere**
