import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, getDoc, setDoc } from "firebase/firestore";

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Load Firebase Config and initialize Firestore
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(firebaseApp);
  }
} catch (error) {
  console.error("Failed to initialize Firestore in Server:", error);
}

// API: Get settings
app.get("/api/settings", async (req, res) => {
  try {
    if (!db) {
      return res.json({ adminPasscode: "1234" });
    }
    const settingsRef = doc(db, "settings", "config");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      res.json(docSnap.data());
    } else {
      res.json({ adminPasscode: "1234" });
    }
  } catch (error: any) {
    console.error("Error reading settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save settings
app.post("/api/settings", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not configured on server" });
    }
    const { adminPasscode } = req.body;
    const settingsRef = doc(db, "settings", "config");
    await setDoc(settingsRef, {
      adminPasscode: adminPasscode || "1234"
    }, { merge: true });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get all contacts
app.get("/api/contacts", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not configured on server" });
    }
    const contactsRef = collection(db, "contacts");
    const q = query(contactsRef);
    const querySnapshot = await getDocs(q);
    const contacts: any[] = [];
    
    querySnapshot.forEach((docSnap) => {
      contacts.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    
    // Sort descending by createdAt
    contacts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    res.json(contacts);
  } catch (error: any) {
    console.error("Error fetching contacts from Firestore:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Save a new contact
app.post("/api/contacts", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not configured on server" });
    }
    const contact = req.body;
    if (!contact.firstName && !contact.lastName) {
      return res.status(400).json({ error: "First Name or Last Name is required" });
    }
    
    const newContact = {
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      pronouns: contact.pronouns || "",
      phones: contact.phones || [],
      emails: contact.emails || [],
      notes: contact.notes || "",
      talkToHuy: !!contact.talkToHuy,
      createdAt: new Date().toISOString()
    };
    
    const contactsRef = collection(db, "contacts");
    const docRef = await addDoc(contactsRef, newContact);
    const savedContact = {
      id: docRef.id,
      ...newContact
    };
    
    res.status(201).json(savedContact);
  } catch (error: any) {
    console.error("Error saving contact to Firestore:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a contact
app.delete("/api/contacts/:id", async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not configured on server" });
    }
    const { id } = req.params;
    const docRef = doc(db, "contacts", id);
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting contact from Firestore:", error);
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
