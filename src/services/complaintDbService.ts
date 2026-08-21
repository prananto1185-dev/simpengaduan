import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import { Complaint } from "../types";
import { INITIAL_COMPLAINTS } from "../data/mockComplaints";

const COLLECTION_NAME = "complaints";

// Clean object helper: removes undefined properties so Firestore doesn't reject them
function cleanFirestoreObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        cleaned[key] = cleanFirestoreObject(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

/**
 * Seeds initial mock data if the collection is empty
 */
export async function seedInitialComplaintsIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    
    if (snapshot.empty) {
      console.log("Seeding initial mock complaints to Firestore...");
      for (const comp of INITIAL_COMPLAINTS) {
        const docRef = doc(db, COLLECTION_NAME, comp.id);
        await setDoc(docRef, cleanFirestoreObject(comp));
      }
      console.log("Initial complaints seeded successfully!");
    }
  } catch (error) {
    console.warn("Firestore seeding check note:", error);
  }
}

/**
 * Real-time listener for complaints collection
 */
export function subscribeToComplaints(
  onUpdate: (complaints: Complaint[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Complaint[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Complaint);
          });
          onUpdate(list);
        } else {
          // If empty, initiate seeding
          seedInitialComplaintsIfEmpty().then(() => {
            onUpdate(INITIAL_COMPLAINTS);
          });
        }
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error("Failed to setup snapshot listener:", err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save new complaint to Firestore
 */
export async function createComplaintInDb(complaint: Complaint): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, complaint.id);
  await setDoc(docRef, cleanFirestoreObject(complaint));
}

/**
 * Update complaint in Firestore
 */
export async function updateComplaintInDb(complaintId: string, updates: Partial<Complaint>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, complaintId);
  await updateDoc(docRef, cleanFirestoreObject(updates));
}
