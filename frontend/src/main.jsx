import React from 'react'
import ReactDOM from 'react-dom/client'
import { UserContextProvider } from './context/userContext.jsx'
import { AdoptionContextProvider } from './context/AdoptionContext.jsx'
import { PetContextProvider } from './context/petContext.jsx'
import { AllDoctorContextProvider } from './context/allDoctorContext.jsx'
import { DoctorContextProvider } from './context/doctorContext.jsx'
import { AllPetOwnerContextProvider } from './context/allPetOwner.jsx'
import { BookingContext, BookingContextProvider } from './context/BookingContext.jsx'
import { LostPetsContextProvider } from './context/LostPetContext.jsx'
import { ConversationProvider } from './context/ConversationContext.jsx'
import { AllPetsContextProvider } from './context/allPetsContext.jsx'
import { InventoryItemsContextProvider } from './context/InventoryItemsContext.jsx'
import { SalesContextProvider } from './context/SalesContext.jsx'
import { SocketContextProvider } from './context/SocketContext.jsx'
import { SupplierContextProvider } from './context/SupplierContext.jsx'
import { MedicalRecordContext } from './context/MedicalRecordContext.jsx'
import { AdoptionRequestProvider } from './context/AdoptionRequestContext.jsx'
import App from './App.jsx'
import firebase from "firebase/compat/app"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate that all required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET'
];

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

firebase.initializeApp(firebaseConfig)


ReactDOM.createRoot(document.getElementById("root")).render(
  <UserContextProvider>
    <AdoptionContextProvider>
      <PetContextProvider>
        <AllDoctorContextProvider>
          <DoctorContextProvider>
            <AllPetOwnerContextProvider>
              <BookingContextProvider>
                <LostPetsContextProvider>
                  <ConversationProvider>
                    <AllPetsContextProvider>
                      <InventoryItemsContextProvider>
                        <SocketContextProvider>
                          <SupplierContextProvider>
                            <SalesContextProvider>
                              <MedicalRecordContext>
                                <AdoptionRequestProvider>
                                  <App />
                                </AdoptionRequestProvider>
                              </MedicalRecordContext>
                            </SalesContextProvider>
                          </SupplierContextProvider>
                        </SocketContextProvider>
                      </InventoryItemsContextProvider>
                    </AllPetsContextProvider>
                  </ConversationProvider>
                </LostPetsContextProvider>
              </BookingContextProvider>
            </AllPetOwnerContextProvider>
          </DoctorContextProvider>
        </AllDoctorContextProvider>
      </PetContextProvider>
    </AdoptionContextProvider>
  </UserContextProvider>
);

