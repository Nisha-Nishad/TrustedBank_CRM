# 🏦 TrustedBank CRM

**A Full-Stack Customer Relationship Management Platform for Banking Operations.**

TrustedBank CRM is a web-based Customer Relationship Management (CRM) application designed to manage banking customers, leads, deals, tasks, and business activities through a centralized platform.

The project focuses on organizing customer relationships and simplifying day-to-day banking CRM workflows with a clean frontend and structured backend architecture.

## 🚀 Live Demo

**Live Application:** https://trusted-bank-crm.vercel.app/

## ✨ Features

- **User Authentication:** Secure authentication using JWT and password hashing.
- **Role-Based Access:** Supports Admin, Manager, and Sales Representative roles.
 <img width="1836" height="895" alt="image" src="https://github.com/user-attachments/assets/314b9a4b-f844-4664-937b-1e4caf890537" /><br><br><br><br>

- **Customer Management:** Maintain customer profiles and contact information.
<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/edd54797-8685-46d0-b680-4ef822cb5437" /><br><br><br><br>
  
- **Lead Management:** Track leads, their sources, interests, and conversion status.
 <img width="1917" height="915" alt="image" src="https://github.com/user-attachments/assets/0469e4d4-e3f6-4b5e-9040-b05f9aaecf50" /><br><br><br><br>

- **Deal Management:** Organize banking deals and monitor their progress through different stages.
<img width="1911" height="910" alt="image" src="https://github.com/user-attachments/assets/9273f13e-8901-4034-937d-cf4e4b447ea7" /><br><br><br><br>

- **Task Management:** Manage follow-ups, calls, meetings, and other activities.
<img width="1911" height="915" alt="image" src="https://github.com/user-attachments/assets/ce980299-4be9-43d7-992a-9b47c885b33e" /><br><br><br><br>

- **Notes Management:** Maintain notes associated with customers, leads, and deals.
<img width="1917" height="912" alt="image" src="https://github.com/user-attachments/assets/ffb0f74a-e935-4ae1-a4d7-f1319b96c853" /><br><br><br><br>

- **Activity Logs:** Track important user actions and system activities.
- **Dashboard & Reports:** Dedicated backend modules for dashboard insights and reporting.
<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/122f3780-059a-4059-9fb1-0b8bf58c88e9" /><br><br><br><br>

- **Search:** Search functionality for CRM records.
- <img width="1913" height="692" alt="image" src="https://github.com/user-attachments/assets/0eadffe0-394f-4b57-a7d0-7aaf79bd847b" /><br><br><br><br>

- **Settings:** Dedicated settings management module.
- <img width="1911" height="912" alt="image" src="https://github.com/user-attachments/assets/72aa6ccd-bda1-4d26-9ea0-f53880bc24ef" /><br><br><br><br>


## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | SQLite |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| Email | Nodemailer |
| Testing | Jest, Vitest |

## 📂 Project Structure

```text
TrustedBank_CRM/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── app.js
│   ├── scripts/
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Nisha-Nishad/TrustedBank_CRM.git

cd TrustedBank_CRM
```

### 2. Setup Backend

```bash
cd backend

npm install
```

Create a `.env` file inside the backend folder and configure the required environment variables.

Example database configuration:

```env
DATABASE_URL="file:./dev.db"
PORT=5000
NODE_ENV=development
```

Configure any additional authentication and email environment variables required by the backend.

Generate Prisma Client and run database migrations:

```bash
npx prisma generate

npx prisma migrate dev --name init
```

Start the backend:

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

`http://localhost:5173`

## 🧪 Testing

Backend tests:

```bash
cd backend
npm test
```

Frontend tests:

```bash
cd frontend
npm test
```

## 🔐 Security

- Password hashing using bcryptjs.
- JWT-based authentication.
- Input validation using Zod.
- Role-based user access structure.

**Note:** This is a development project and should not be used for handling real banking transactions or sensitive financial data without appropriate security audits and compliance measures.

## 🎯 Project Objective

The main objective of TrustedBank CRM is to develop a centralized banking CRM solution that helps organize customer information, track potential business opportunities, manage follow-ups, and maintain operational activity records.

## 👩‍💻 Author

**Nisha Nishad**

- GitHub: [Nisha-Nishad](https://github.com/Nisha-Nishad)
- LinkedIn: [Connect with me](https://www.linkedin.com/in/nisha-nishad-b94877286/)

---
## 🔐 Authentication & Role Selection

TrustedBank Portal provides a dedicated login interface for accessing the CRM platform.

Key login features include:

- Official work email and password authentication.
- Forgot password option.
- Quick-select testing roles for convenient testing.
- Separate access levels for Admin, Manager, and Relationship Managers.
- Support for testing with 10 Relationship Manager accounts.

### Login Page

<img width="1836" height="895" alt="image" src="https://github.com/user-attachments/assets/a927610b-6cbf-4d90-99ab-a611323e2587" /><br><br><br><br>


*The login interface includes role-selection shortcuts for testing different user access levels.*
⭐ If you find this project interesting, feel free to explore the repository and share your feedback!
