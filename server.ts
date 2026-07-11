import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "contacts.json");

// Middleware to parse JSON
app.use(express.json());

// Helper to read contacts
const readContacts = (): any[] => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading contacts file:", error);
    return [];
  }
};

// Helper to write contacts
const writeContacts = (contacts: any[]) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(contacts, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing contacts file:", error);
  }
};

// API: Get all contacts
app.get("/api/contacts", (req, res) => {
  res.json(readContacts());
});

// API: Save a new contact
app.post("/api/contacts", (req, res) => {
  try {
    const contact = req.body;
    if (!contact.firstName && !contact.lastName) {
      return res.status(400).json({ error: "First Name or Last Name is required" });
    }
    
    const contacts = readContacts();
    const newContact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    contacts.push(newContact);
    writeContacts(contacts);
    
    res.status(201).json(newContact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a contact
app.delete("/api/contacts/:id", (req, res) => {
  try {
    const { id } = req.params;
    let contacts = readContacts();
    contacts = contacts.filter((c) => c.id !== id);
    writeContacts(contacts);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Integrate Vite middleware or serve production assets
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
