const { BlobServiceClient } = require('@azure/storage-blob');

class AzureStorageService {
  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    this.containerClient = this.blobServiceClient.getContainerClient(
      process.env.CONTAINER_NAME
    );
  }

  streamToString(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', (data) => {
        chunks.push(data.toString());
      });
      readableStream.on('end', () => {
        resolve(chunks.join(''));
      });
      readableStream.on('error', reject);
    });
  }

  async initializeContainer() {
    try {
      await this.containerClient.createIfNotExists();
      console.log('Container initialized successfully');
    } catch (error) {
      console.error('Error initializing container:', error);
      throw error;
    }
  }

  async storeOTPData(email, otpData) {
    try {
      const blobName = `otp/${email}.json`;
      console.log('Storing OTP data in blob:', blobName);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const content = JSON.stringify({
        ...otpData,
        created: Date.now()
      });
      
      await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: { blobContentType: 'application/json' }
      });
      console.log('Successfully stored OTP data for:', email);
    } catch (error) {
      console.error('Error storing OTP data:', error);
      throw error;
    }
  }

  async getOTPData(email) {
    try {
      const blobName = `otp/${email}.json`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const exists = await blockBlobClient.exists();
      if (!exists) {
        return null;
      }

      const downloadResponse = await blockBlobClient.download();
      const data = await this.streamToString(downloadResponse.readableStreamBody);
      const otpData = JSON.parse(data);
      
      // Check if OTP has expired (10 minutes)
      if (Date.now() - otpData.created > 600000) {
        await this.deleteOTPData(email);
        return null;
      }
      
      return otpData;
    } catch (error) {
      console.error('Error retrieving OTP data:', error);
      return null;
    }
  }

  async deleteOTPData(email) {
    try {
      const blobName = `otp/${email}.json`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      console.log('Successfully deleted OTP data for:', email);
    } catch (error) {
      console.error('Error deleting OTP data:', error);
    }
  }

  async storeOTPData(email, otpData) {
    try {
      const blobName = `otp/${email}.json`;
      console.log('Storing OTP data in blob:', blobName);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const content = JSON.stringify({
        ...otpData,
        created: Date.now()
      });
      
      await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: { blobContentType: 'application/json' }
      });
      console.log('Successfully stored OTP data for:', email);
    } catch (error) {
      console.error('Error storing OTP data:', error);
      throw error;
    }
  }

  async getOTPData(email) {
    try {
      const blobName = `otp/${email}.json`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const exists = await blockBlobClient.exists();
      if (!exists) {
        return null;
      }

      const downloadResponse = await blockBlobClient.download();
      const data = await this.streamToString(downloadResponse.readableStreamBody);
      const otpData = JSON.parse(data);
      
      // Check if OTP has expired (10 minutes)
      if (Date.now() - otpData.created > 600000) {
        await this.deleteOTPData(email);
        return null;
      }
      
      return otpData;
    } catch (error) {
      console.error('Error retrieving OTP data:', error);
      return null;
    }
  }

  async deleteOTPData(email) {
    try {
      const blobName = `otp/${email}.json`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      console.log('Successfully deleted OTP data for:', email);
    } catch (error) {
      console.error('Error deleting OTP data:', error);
    }
  }

  async storeUserData(userId, userData) {
    try {
      const blobName = `users/${userId}.json`;
      console.log('Creating blob:', blobName);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Check for existing user data
      try {
        const exists = await blockBlobClient.exists();
        console.log('Blob exists check:', exists);
        if (exists) {
          throw new Error('User already exists');
        }
      } catch (error) {
        if (error.message === 'User already exists') {
          throw error;
        }
        console.error('Error checking blob existence:', error);
        throw new Error('Error checking user existence');
      }

      const content = JSON.stringify(userData);
      console.log('Uploading user data for:', userId);
      await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: { blobContentType: 'application/json' }
      });
      console.log('Successfully uploaded user data for:', userId);
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  async getUserData(userId) {
    try {
      const blobName = `users/${userId}.json`;
      console.log('Attempting to retrieve user data for:', userId);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      const exists = await blockBlobClient.exists();
      if (!exists) {
        console.log('User data not found for:', userId);
        return null;
      }

      const downloadResponse = await blockBlobClient.download();
      const data = await streamToString(downloadResponse.readableStreamBody);
      console.log('Successfully retrieved user data for:', userId);
      return JSON.parse(data);
    } catch (error) {
      console.error('Error retrieving user data:', error);
      throw error;
    }
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

module.exports = new AzureStorageService();