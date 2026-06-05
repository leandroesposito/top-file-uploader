# File Uploader - Prisma ORM & File Management

A complete file management system with user authentication, folder organization, and cloud storage integration, built with Express, Prisma ORM, Passport.js, and Supabase storage.

## Learning Objectives

This project was specifically designed to demonstrate and practice:

- **What ORMs Are** - Object-Relational Mapping concepts and benefits
- **Why Use ORMs** - Abstraction, security, and productivity
- **Prisma ORM** - Modern Node.js/TypeScript ORM features
- **Prisma Features** - Schema definition, migrations, type-safe queries
- **Multer Middleware** - File upload handling
- **File Validation** - Size limits and file type validation

## Live Demo

[View Live Demo](https://top-file-uploader-2cyp.onrender.com/)

## What is an ORM?

**ORM (Object-Relational Mapping)** is a technique that lets you interact with your database using your programming language's objects instead of writing raw SQL queries.

### Traditional SQL vs ORM

```sql
-- Raw SQL (Traditional)
INSERT INTO users (username, password) VALUES ('john', 'hashed_password');
SELECT * FROM users WHERE id = 1;
UPDATE users SET username = 'new_name' WHERE id = 1;
DELETE FROM users WHERE id = 1;
```

```javascript
// Prisma ORM (JavaScript objects)
const user = await prisma.user.create({
  data: { username: "john", password: "hashed_password" },
});

const user = await prisma.user.findUnique({
  where: { id: 1 },
});

const user = await prisma.user.update({
  where: { id: 1 },
  data: { username: "new_name" },
});

const user = await prisma.user.delete({
  where: { id: 1 },
});
```

### Why Use an ORM?

| Benefit                      | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| **Abstraction**              | Work with JavaScript objects, not SQL strings   |
| **Type Safety**              | Compile-time type checking (TypeScript support) |
| **SQL Injection Prevention** | Automatic parameterization                      |
| **Database Agnostic**        | Switch databases without rewriting queries      |
| **Relationships**            | Easy handling of joins and nested data          |
| **Migrations**               | Version control for database schema             |
| **Query Building**           | Programmatic query construction                 |

## Introducing Prisma ORM

**Prisma** is a next-generation ORM that provides:

- Type-safe database client
- Intuitive data modeling
- Automated migrations
- Powerful relation handling

### Prisma Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                       │
├─────────────────────────────────────────────────────────────┤
│                    Prisma Client (Type-safe)                │
├─────────────────────────────────────────────────────────────┤
│                      Prisma Engine                          │
├─────────────────────────────────────────────────────────────┤
│                      PostgreSQL Database                    │
└─────────────────────────────────────────────────────────────┘
```

## Prisma Schema Definition

### Complete Schema (prisma/schema.prisma)

```javascript
// Data source configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Client generator
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

// Session model (for express-session with PostgreSQL)
model Session {
  id        String   @id
  sid       String   @unique
  data      String
  expiresAt DateTime
}

// User model with relationships
model User {
  id       String   @id @default(uuid())
  username String   @unique
  password String
  files    File[]   // One-to-many relation
  Folder   Folder[] // One-to-many relation
}

// File model with foreign keys
model File {
  id       String  @id @default(uuid())
  name     String
  size     Int
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId   String
  folder   Folder? @relation(fields: [folderId], references: [id], onDelete: Cascade)
  folderId String?
  url      String
  path     String
}

// Folder model with self-relation (nested folders)
model Folder {
  id       String   @id @default(uuid())
  name     String
  parent   Folder?  @relation("folderTree", fields: [parentId], references: [id], onDelete: Cascade)
  parentId String?
  children Folder[] @relation("folderTree")
  files    File[]
  user     User     @relation(fields: [userId], references: [id])
  userId   String
}
```

### Prisma Schema Features

| Feature            | Syntax                       | Purpose                         |
| ------------------ | ---------------------------- | ------------------------------- |
| **Models**         | `model User { ... }`         | Define database tables          |
| **Fields**         | `username String @unique`    | Define columns with constraints |
| **Relations**      | `files File[]`               | One-to-many relationships       |
| **Self-Relation**  | `parent Folder?`             | Hierarchical folders            |
| **Attributes**     | `@id`, `@unique`, `@default` | Field modifiers                 |
| **Env Variables**  | `env("DATABASE_URL")`        | Secure configuration            |
| **Cascade Delete** | `onDelete: Cascade`          | Automatic cleanup               |

## Prisma Setup & Configuration

### Installation

```bash
# Install Prisma CLI (dev dependency)
npm install prisma --save-dev

# Install Prisma Client (runtime)
npm install @prisma/client

# Initialize Prisma
npx prisma init
```

### Configuration File

```typescript
// prisma.config.ts
import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### Environment Variables

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/file_uploader"
```

## Prisma Client Usage

### Initializing Prisma Client

```javascript
// db/user.js
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
```

### CRUD Operations with Prisma

#### Create (INSERT)

```javascript
// Create a user
async function createUser(user) {
  const newUser = await prisma.user.create({
    data: {
      username: user.username,
      password: user.password,
    },
  });
  return newUser;
}

// Create a folder with parent relation
async function createFolder(name, parentId, userId) {
  const newFolder = prisma.folder.create({
    data: {
      name: name,
      parentId: parentId || null, // null for root folders
      userId: userId,
    },
  });
  return newFolder;
}
```

#### Read (SELECT)

```javascript
// Find unique by ID (excludes password)
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id: id },
    omit: { password: true }, // Exclude sensitive fields
  });
  return user;
}

// Find with relations (JOIN)
async function getFolderContent(folderId, userId) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      files: { orderBy: { name: "asc" } }, // Include related files
      children: { orderBy: { name: "asc" } }, // Include subfolders
    },
  });
  return folder;
}
```

#### Update (UPDATE)

```javascript
// Rename a folder
async function renameFolderById(id, newName) {
  const folder = await prisma.folder.update({
    where: { id: id },
    data: { name: newName },
  });
  return folder;
}

// Rename a file with path updates
async function renameFileById(id, newName, newPath, newUrl) {
  const file = await prisma.file.update({
    where: { id: id },
    data: {
      name: newName,
      path: newPath,
      url: newUrl,
    },
  });
  return file;
}
```

#### Delete (DELETE)

```javascript
// Delete with cascade (ON DELETE CASCADE handles related records)
async function deleteFolderById(id) {
  const folder = await prisma.folder.delete({
    where: { id: id },
    include: { files: true }, // Get files before deletion
  });
  return folder;
}
```

### Complex Queries with Relations

```javascript
// Get folder path (breadcrumb navigation)
async function getFolderPath(folderId) {
  const path = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true },
    });

    if (!folder) break;

    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return path;
}

// Recursive file collection
async function getFilesRecursive(folderId) {
  const queue = [folderId];
  const files = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const folder = await getFolderContent(currentId);
    files.push(...folder.files);
    queue.push(...folder.children.map((c) => c.id));
  }

  return files;
}
```

## Prisma Migrations

Migrations are version control for your database schema.

### Migration Commands

```bash
# Create a new migration (after schema changes)
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npx prisma generate

# Reset database (development only)
npx prisma migrate reset

# View migration history
npx prisma migrate status
```

### Migration File Structure

```
prisma/migrations/
├── 20250101000000_init/
│   └── migration.sql
├── 20250115000000_add_folder_parent/
│   └── migration.sql
└── migration_lock.toml
```

## Multer Middleware for File Uploads

### What is Multer?

Multer is a Node.js middleware for handling `multipart/form-data`, primarily used for file uploads.

### Multer Configuration

```javascript
// controllers/upload.js
const multer = require("multer");
const storage = multer.memoryStorage(); // Store files in memory

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB limit
  },
}).single("file"); // Expect single file with field name "file"
```

### File Validation

```javascript
// Server-side validation with Multer
upload(req, res, async function (err) {
  // Check if file was selected
  if (!req.file) {
    req.flash("error", "You must select a file to upload");
    return res.redirect(`/folder/${folderId}`);
  }

  // Handle Multer errors
  if (err) {
    if (err instanceof multer.MulterError) {
      req.flash("error", err.message + " max file size is 5 MB");
      return res.redirect(`/folder/${folderId}`);
    }
    throw err;
  }

  // Custom validation
  if (file.name.length < 4 || file.name.length > 100) {
    req.flash("error", "File name must be between 4 and 100 characters");
    return res.redirect(`/folder/${folderId}`);
  }

  // Check for duplicate names
  if (folder.files.find((f) => f.name === file.name)) {
    req.flash("error", "You already have a file with that name!");
    return res.redirect(`/folder/${folderId}`);
  }

  // Process file...
});
```

### Client-side File Validation

```ejs
<!-- views/partials/upload-form.ejs -->
<script>
  const MAX_FILE_MB = 5;
  const MAX_FILE_SIZE = 1024 * 1024 * MAX_FILE_MB;

  fileForm.addEventListener("submit", (event) => {
    const file = fileForm.querySelector("#file").files[0];
    const fileMb = Math.floor(file.size / 1024 / 1024 * 100) / 100;

    if (MAX_FILE_SIZE < file.size) {
      event.preventDefault();
      alert(`File size ${fileMb}MB exceeds limit of ${MAX_FILE_MB}MB`);
    }
  });
</script>
```

### Supabase Storage Integration

```javascript
// Upload file to Supabase Storage
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASEURL,
  process.env.SUPABASEAPIKEY,
);

// Upload file
const filePath = `${userId}/${folderId}/${file.originalname}`;
const { data, error } = await supabase.storage
  .from("uploads")
  .upload(filePath, file.buffer, {
    cacheControl: "3600",
    upsert: false,
  });

// Generate public URL
const fileUrl = `${process.env.SUPABASEURL}/storage/v1/object/public/uploads/${data.path}`;

// Delete file
const { data, error } = await supabase.storage
  .from("uploads")
  .remove([filePath]);

// Move/Rename file
const { data, error } = await supabase.storage
  .from("uploads")
  .move(oldPath, newPath);
```

## Session Management with Prisma

```javascript
// app.js - Prisma session store
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("./generated/prisma");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, // Clean expired sessions every 2 min
      dbRecordIdIsSessionId: true, // Use session ID as record ID
      dbRecordIdFunction: undefined,
    }),
  }),
);
```

## Hierarchical Folder Structure

### Self-Referencing Relation

```javascript
model Folder {
  id       String   @id @default(uuid())
  name     String
  parent   Folder?  @relation("folderTree", fields: [parentId], references: [id])
  parentId String?
  children Folder[] @relation("folderTree")
  // ... other fields
}
```

### Folder Path Generation

```javascript
// Get breadcrumb navigation path
async function getFolderPath(folderId) {
  const path = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true },
    });

    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return path; // e.g., [{id:"1",name:"Documents"}, {id:"2",name:"Projects"}]
}
```

## Prisma vs Raw SQL Comparison

| Feature                | Raw SQL                 | Prisma ORM                   |
| ---------------------- | ----------------------- | ---------------------------- |
| **Query Writing**      | Write SQL strings       | Write JavaScript objects     |
| **Type Safety**        | Runtime errors only     | Compile-time type checking   |
| **Relations**          | Manual JOINs            | Automatic with `include`     |
| **Migrations**         | Manual SQL scripts      | Auto-generated from schema   |
| **SQL Injection**      | Manual parameterization | Automatic protection         |
| **Database Switching** | Rewrite queries         | Change connection string     |
| **Nested Writes**      | Complex transactions    | `create: { include: {...} }` |

## What I learned

### What ORMs Are

- **Object-Relational Mapping** - Bridge between objects and relational databases
- **Abstraction Layer** - Work with objects, not SQL
- **Productivity Tool** - Reduces boilerplate code

### Why Use ORMs

- **Security** - Automatic SQL injection prevention
- **Type Safety** - Catch errors at compile time
- **Maintainability** - Schema as single source of truth
- **Portability** - Switch databases without code changes

### Prisma ORM Features

- **Intuitive Schema** - Clean, readable model definitions
- **Type-safe Client** - Auto-generated TypeScript types
- **Powerful Relations** - Easy handling of nested data
- **Migrations** - Version control for database schema
- **Relation Fluent API** - `include`, `select`, `where` for relations

### Multer Middleware

- **File Handling** - Process `multipart/form-data` uploads
- **Memory/ Disk Storage** - Flexible storage options
- **File Validation** - Size limits, file type filtering
- **Error Handling** - Multer-specific error types
