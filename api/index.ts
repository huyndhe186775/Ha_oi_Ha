import express from "express";
import fs from "fs";
import path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query } from "firebase/firestore";

const app = express();
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
  console.error("Failed to initialize Firestore in API:", error);
}

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
    
    res.status(201).json({
      id: docRef.id,
      ...newContact
    });
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

export default app;
