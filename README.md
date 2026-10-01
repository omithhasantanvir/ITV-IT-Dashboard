# IT Management & Asset Control System

This project provides a local-only internal IT operations dashboard designed for office networks.

## Local setup

1. Install MongoDB locally.
2. Create a `.env` file in `backend/` based on `backend/.env.example`.
3. Install dependencies:
   - `cd backend && npm install`
   - `cd ../client && npm install`
4. Start backend: `npm run server`
5. Start frontend: `npm run client`
6. Access the app at `http://localhost:5173` and API at `http://localhost:5000`

## Windows LAN access

- Run backend with `HOST=0.0.0.0` support enabled in `server.js`.
- Open firewall inbound rules for ports `5000` and `5173`.
- Example firewall commands for admin PowerShell:
  - `New-NetFirewallRule -DisplayName "IT Dashboard API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow`
  - `New-NetFirewallRule -DisplayName "IT Dashboard Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow`

## Backup strategy

- MongoDB dump: `mongodump --db it_management --out ./database/backup`
- MongoDB restore: `mongorestore --db it_management ./database/backup/it_management`
- Uploads backup: copy the `backend/uploads` folder to a secure backup location.

## Scripts

- `npm run dev` - run backend and frontend together
- `npm run server` - run backend only
- `npm run client` - run frontend only
- `npm run build` - build frontend for production
- `npm start` - run backend in production mode

## Roles

- Super Admin
- IT Admin
- IT Support
- Viewer

## Notes

The application is designed for private office/local network deployment and should not be exposed to public internet by default.
