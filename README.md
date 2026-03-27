# Robot Controller

A web-based robot control system consisting of a **backend mock robot server** and a **frontend control interface**.  
The backend simulates robot behavior while the frontend provides a real-time control dashboard.

---

# Steps to Run:

cd robot-backend
npm install
npm run mock

open new terminal

cd robot-frontend
npm install
npm run dev


# if error in cd frontend:
# Fix (Recommended):
Downgrade vite to v7 so it matches the plugin.

1. Delete existing install
rm -rf node_modules package-lock.json
2. Install compatible versions
npm install vite@^7 @vitejs/plugin-react@^4
3. Install everything
npm install
4. Run dev server
npm run dev