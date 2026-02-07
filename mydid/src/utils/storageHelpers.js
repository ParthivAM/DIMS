// utils/storageHelpers.js - Helper functions for localStorage operations

// ==================== ISSUER FUNCTIONS ====================

// Get issued credentials for an issuer
export const getIssuedCredentials = (issuerAddress) => {
  try {
    const key = `issuedCredentials_${issuerAddress.toLowerCase()}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error getting issued credentials:', err);
    return [];
  }
};

// Save issued credentials for an issuer
export const saveIssuedCredentials = (issuerAddress, credentials) => {
  try {
    const key = `issuedCredentials_${issuerAddress.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(credentials));
    console.log('✅ Issued credentials saved');
    return { success: true };
  } catch (err) {
    console.error('Error saving issued credentials:', err);
    return { success: false, error: err.message };
  }
};

// Delete a specific issued credential
export const deleteIssuedCredential = (issuerAddress, cid) => {
  try {
    const credentials = getIssuedCredentials(issuerAddress);
    const filtered = credentials.filter(cred => cred.cid !== cid);
    saveIssuedCredentials(issuerAddress, filtered);
    console.log('✅ Issued credential deleted:', cid);
    return { success: true };
  } catch (err) {
    console.error('Error deleting issued credential:', err);
    return { success: false, error: err.message };
  }
};

// Get credential requests for an issuer
export const getCredentialRequests = (issuerAddress) => {
  try {
    const key = `credentialRequests_${issuerAddress.toLowerCase()}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error getting credential requests:', err);
    return [];
  }
};

// Save credential requests for an issuer
export const saveCredentialRequests = (issuerAddress, requests) => {
  try {
    const key = `credentialRequests_${issuerAddress.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(requests));
    console.log('✅ Credential requests saved');
    return { success: true };
  } catch (err) {
    console.error('Error saving credential requests:', err);
    return { success: false, error: err.message };
  }
};

// Delete a specific credential request
export const deleteCredentialRequest = (issuerAddress, requestId) => {
  try {
    const requests = getCredentialRequests(issuerAddress);
    const filtered = requests.filter(req => req.id !== requestId);
    saveCredentialRequests(issuerAddress, filtered);
    console.log('✅ Credential request deleted:', requestId);
    return { success: true };
  } catch (err) {
    console.error('Error deleting credential request:', err);
    return { success: false, error: err.message };
  }
};

// ==================== HOLDER FUNCTIONS ====================

// Get holder requests
export const getHolderRequests = (holderAddress) => {
  try {
    const key = `holderRequests_${holderAddress.toLowerCase()}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error getting holder requests:', err);
    return [];
  }
};

// Save holder requests
export const saveHolderRequests = (holderAddress, requests) => {
  try {
    const key = `holderRequests_${holderAddress.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(requests));
    console.log('✅ Holder requests saved');
    return { success: true };
  } catch (err) {
    console.error('Error saving holder requests:', err);
    return { success: false, error: err.message };
  }
};

// Delete a specific holder request
export const deleteHolderRequest = (holderAddress, requestId) => {
  try {
    const requests = getHolderRequests(holderAddress);
    const filtered = requests.filter(req => req.id !== requestId);
    saveHolderRequests(holderAddress, filtered);
    console.log('✅ Holder request deleted:', requestId);
    return { success: true };
  } catch (err) {
    console.error('Error deleting holder request:', err);
    return { success: false, error: err.message };
  }
};
