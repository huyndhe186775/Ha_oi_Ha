import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

// On Vercel, serverless environments have a read-only filesystem,
// except for the /tmp directory.
const DB_FILE = "/tmp/contacts.json";

// Helper to read contacts safely
const readContacts = (): any[] => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Seed /tmp/contacts.json from the project's root contacts.json if it exists
      const initialDbFile = path.join(process.cwd(), "contacts.json");
      if (fs.existsSync(initialDbFile)) {
        const initialData = fs.readFileSync(initialDbFile, "utf-8");
        fs.writeFileSync(DB_FILE, initialData, "utf-8");
        return JSON.parse(initialData || "[]");
      }
      return [];
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading contacts file:", error);
    return [];
  }
};

// Helper to write contacts safely
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

export default app;
