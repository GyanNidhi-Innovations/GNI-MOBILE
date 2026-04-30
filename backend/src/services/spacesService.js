


// services/spacesService.js - AWS SDK v3 VERSION

import dotenv from 'dotenv';
dotenv.config();


import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, ListBucketsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: process.env.SPACES_ENDPOINT,
  region: process.env.SPACES_REGION,
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY,
    secretAccessKey: process.env.SPACES_SECRET_KEY,
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.SPACES_BUCKET || 'interview-video-bucket';

/**
 * Upload resume to Spaces
 */
export const uploadResumeToSpaces = async (fileBuffer, originalName, userId) => {
  try {
    console.log('📤 Uploading to Spaces bucket:', BUCKET_NAME);
    
    // Get file extension
    const fileExtension = path.extname(originalName) || '.pdf';
    
    // Generate unique filename
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    
    // Create path in Spaces
    const spacesKey = `resumes/user_${userId}/${uniqueFileName}`;
    
    console.log('📁 Uploading to:', spacesKey);
    
    // Upload using Upload class for better handling
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: spacesKey,
        Body: fileBuffer,
        ContentType: getContentType(fileExtension),
        Metadata: {
          'original-name': originalName,
          'user-id': userId.toString(),
          'uploaded-at': new Date().toISOString()
        }
      },
    });

    const result = await parallelUploads3.done();
    
    console.log('✅ Resume uploaded to Spaces:', {
      bucket: BUCKET_NAME,
      key: spacesKey,
      url: `https://${BUCKET_NAME}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${spacesKey}`,
      size: (fileBuffer.length / 1024 / 1024).toFixed(2) + ' MB'
    });

    return {
      spacesKey: spacesKey,
      spacesUrl: `https://${BUCKET_NAME}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${spacesKey}`,
      storedName: uniqueFileName,
      originalName: originalName,
      bucketName: BUCKET_NAME
    };
    
  } catch (error) {
    console.error('❌ Spaces upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Generate signed URL for secure download
 */
export const generateSignedUrl = async (spacesKey, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: spacesKey,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log('✅ Generated signed URL for:', spacesKey);
    return signedUrl;
    
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw error;
  }
};

/**
 * Check if a file exists in Spaces
 */
export const checkFileExists = async (spacesKey) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: spacesKey,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * List files in resumes folder
 */
export const listResumesInSpaces = async () => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'resumes/',
      MaxKeys: 50
    });
    
    const data = await s3Client.send(command);
    
    console.log('📁 Contents of resumes/ folder:');
    if (data.Contents && data.Contents.length > 0) {
      data.Contents.forEach(item => {
        console.log(`  - ${item.Key} (${(item.Size / 1024).toFixed(2)} KB)`);
      });
    } else {
      console.log('  (Empty folder)');
    }
    
    return data.Contents || [];
  } catch (error) {
    console.error('❌ Error listing resumes:', error);
    return [];
  }
};

/**
 * Test Spaces connection
 */
export const testSpacesConnection = async () => {
  try {
    console.log('🔍 Testing Spaces connection...');
    
    // List buckets
    const command = new ListBucketsCommand({});
    const data = await s3Client.send(command);
    
    console.log('✅ Connected! Available buckets:', data.Buckets.map(b => b.Name));
    
    // Check our specific bucket
    const ourBucket = data.Buckets.find(b => b.Name === BUCKET_NAME);
    if (ourBucket) {
      console.log(`✅ Found bucket: ${BUCKET_NAME}`);
      
      // List contents
      await listResumesInSpaces();
      
      return {
        connected: true,
        bucketExists: true,
        bucketName: BUCKET_NAME
      };
    } else {
      console.log(`❌ Bucket not found: ${BUCKET_NAME}`);
      return {
        connected: true,
        bucketExists: false,
        bucketName: BUCKET_NAME
      };
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return {
      connected: false,
      error: error.message
    };
  }
};

/**
 * Get content type from file extension
 */
const getContentType = (extension) => {
  const types = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return types[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Delete resume from Spaces
 */
export const deleteResumeFromSpaces = async (spacesKey) => {
  try {
    console.log('🗑️  Deleting from Spaces:', spacesKey);
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: spacesKey,
    });
    
    const result = await s3Client.send(command);
    console.log('✅ File deleted from Spaces:', spacesKey);
    
    return {
      success: true,
      deletedKey: spacesKey,
      deletedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error deleting from Spaces:', error);
    
    // Don't throw if file doesn't exist
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      console.log('ℹ️  File already deleted or never existed:', spacesKey);
      return {
        success: true,
        deletedKey: spacesKey,
        message: 'File not found (already deleted?)'
      };
    }
    
    throw new Error(`Delete failed: ${error.message}`);
  }
};