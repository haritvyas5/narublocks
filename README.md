# Naruino Marketplace

[![Stelace](https://user-images.githubusercontent.com/12909094/59638847-c41f1900-9159-11e9-9fa5-6d7806d57c92.png)](https://stelace.com)

An advanced, open-source marketplace for Arduino projects and Narublocks. Built on the **Stelace API** and **Quasar Framework**, this platform allows makers to share, fork, and manage their hardware projects with ease.

---

## 🚀 Overview

Naruino Marketplace is a high-performance project sharing platform designed for the maker community. It features a modern, reactive UI with a powerful backend capable of handling asset management, search, and user collaboration.

### Key Features
- **Project Discovery**: Powerful, typo-tolerant search and category-based filtering.
- **Detailed Project Views**: Comprehensive display of project descriptions, Bill of Materials (BOM), schematics, and code.
- **Interactive Comments**: Engage with the community on specific projects.
- **Project Interaction**:
    - **Forking**: Clone any existing project to your own account to start your own version.
    - **Management**: Easy uploading, editing, and deletion for project owners.
    - **File Sharing**: Support for uploading and downloading project files (e.g., `.ino`, `.zip`, Narublocks).
- **Responsive Design**: Fully optimized for mobile and desktop using Quasar's reactive layout.

---

## 🛠 Tech Stack

### Frontend
- **Vue.js 2**: Core reactive framework.
- **Quasar Framework**: UI components and responsive layout.
- **Vuex**: Centralized state management.
- **Lodash**: Utility functions.

### Backend (Stelace)
- **Stelace API Server**: Open-source backend based on Restify.
- **PostgreSQL**: Relational database for core data.
- **ElasticSearch**: Powering the advanced search engine.
- **Redis**: Caching and session management.
- **Local Storage Plugin**: Simulated S3 storage for local development.

---

## 🏗 Project Structure

```text
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Full-page views (Home, Asset, Upload, etc.)
│   ├── store/          # Vuex modules (Asset, User, Search, etc.)
│   ├── utils/          # Client-side utility functions (S3, Stelace, etc.)
│   └── mixins/         # Shared Vue mixins
├── stelace/            # Backend API server
│   ├── plugins/        # Backend extensions (e.g., local-storage)
│   ├── server/         # Main server entry and configuration
│   └── public/         # Publicly served assets (uploaded files)
└── quasar.conf.js      # Frontend build and dev server configuration
```

---

## 📋 Getting Started

### Prerequisites
- **Node.js**: >= 12.x
- **Yarn**: Recommended for dependency management.
- **Docker**: Required for running backend databases (Postgres, ElasticSearch, Redis) locally.

### Installation

1. **Clone the project**:
   ```bash
   git clone <repository-url>
   cd Marketplace
   ```

2. **Setup Backend Databases**:
   Ensure Docker is running, then start the required services:
   ```bash
   cd Marketplace
   docker-compose up -d
   ```

3. **Install Dependencies**:
   ```bash
   # Root (Frontend)
   yarn
   
   # Backend
   cd stelace
   yarn
   ```

4. **Environment Configuration**:
   Create a `.env.development` in the root:
   ```bash
   cp .env.example .env.development
   ```
   *Note: Ensure `STELACE_PUBLISHABLE_API_KEY` and other keys match your local Stelace setup.*

5. **Seed Data**:
   ```bash
   cd Marketplace
   yarn seed
   ```

### Running the Application

Start both the frontend and backend concurrently:
```bash
# In the root directory
yarn dev
```
The frontend will typically be available at `http://localhost:8080`.

---

## 🔧 Core Workflows

### Project Forking
Authenticated users can "Fork" projects they don't own. This creates a duplicate of the project in their own account with a link back to the original project in the metadata.

### File Uploads
Project creators can upload `.ino` or Narublock files. These are stored via a signed URL mechanism. In local development, the `local-storage` plugin handles these files, serving them from `stelace/public/files`.

### Search & Tags
Projects can be tagged during upload. These tags are indexed and allow for quick filtering on the homepage or via the search bar.

---

## 📄 License
This project is licensed under the **MIT License**.

---
*Made with ❤️ for the Maker Community by the Stelace Team.*
