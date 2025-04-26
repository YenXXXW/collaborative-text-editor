# collaborative-text-editor

A real-time collaborative text editor built with **Go** (backend) and **React** (frontend).  
Users can join a room, write code together, and see updates live.

---

## 🚀 Features

- Real-time collaborative code editing
- Room-based user sessions
- Language selector (JS, Python, C++, etc.)
- Rejoin support
- Sidebar with list of participants
- Code download button
- Autocomplete(JS only) 

---

## 📁 Project Structure
```
root/ 
├── cmd/ # Go backend entry point 
├── internal/ # Go application logic 
├── web/ # React frontend 
├── go.mod 
├── go.sum 
├── Dockerfile 
└── docker-compose.yml
```

> 📌 Note: There is **no separate `backend` folder** — everything is in the root structure.

---

## 🛠️ Prerequisites

- Go ≥ 1.23
- Node.js ≥ 18.x
- npm (or yarn/pnpm)
- [Air](https://github.com/cosmtrek/air) for hot-reloading Go backend (optional)

---

## 🧑‍💻 Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/YenXXXW/collaborative-text-editor.git
cd collaborative-text-editor
```

### 2. Install Go Dependencies

```bash
go mod tidy
```

> This command will download and install all Go packages defined in `go.mod`.

### 3. Start Go Backend

#### Using Air (recommended for auto-reload)

```bash
air
```

#### Or using Go directly

```bash
go run ./cmd/api
```

### 4. Start React Frontend

```bash
cd web
npm install    
npm run dev       
```

📚 Conclusion
This project combines the speed and simplicity of Go with the flexibility of React to create a powerful real-time collaborative environment.
