# Backend Setup (PostgreSQL)

## Start PostgreSQL

```bash
cd backend
docker compose up -d
```

## Connection

Use these default values (or override via your own env):

- Host: `localhost`
- Port: `5432`
- User: `pm_user`
- Password: `pm_password`
- Database: `pm_db`

## App Environment

Create `.env.local` in project root:

```bash
PGHOST=localhost
PGPORT=5432
PGUSER=pm_user
PGPASSWORD=pm_password
PGDATABASE=pm_db
```

Then run:

```bash
npm run dev
```

## Default Users

All users use default password: `password`

- `admin` -> role `admin` (manage all)
- `manager` -> role `manager` (manage goal)
- `user1` -> role `staff` (manage own project/ability/ticket)
- `user2` -> role `staff` (manage own project/ability/ticket)
- `user3` -> role `staff` (manage own project/ability/ticket)
