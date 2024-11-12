import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    // Determine the S3 key based on the file extension
    const fileExtension = fileName.split('.').pop();
    let s3Key;
    let contentType;

    if (fileExtension === 'mp4') {
      s3Key = `videos/${fileName}`;
      contentType = 'video/mp4';
    } else if (fileExtension === 'wav') {
      s3Key = `unprocessed/${fileName}`;
      contentType = 'audio/wav';
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only .mp4 and .wav are allowed.' },
        { status: 400 }
      );
    }

    // Create the S3 PutObject command with the determined key and content type
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    });

    // Generate a presigned URL for uploading
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
