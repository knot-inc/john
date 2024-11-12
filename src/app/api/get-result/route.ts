import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jsonFileName = searchParams.get('jsonFileName');

  if (!jsonFileName) {
    return NextResponse.json(
      { error: 'Missing jsonFileName parameter' },
      { status: 400 }
    );
  }

  const bucketName = process.env.AWS_BUCKET_NAME;
  const objectKey = `outputs/${jsonFileName}`;

  const params = {
    Bucket: bucketName,
    Key: objectKey,
  };

  try {
    // Fetch the object from S3
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    // Read the streaming data and parse it as JSON
    const streamToString = (stream: any): Promise<string> =>
      new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('end', () =>
          resolve(Buffer.concat(chunks).toString('utf-8'))
        );
        stream.on('error', reject);
      });

    const resultString = await streamToString(response.Body);
    const resultJson = JSON.parse(resultString);

    return NextResponse.json(resultJson, { status: 200 });
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return NextResponse.json(
        { message: 'Result not yet available' },
        { status: 404 }
      );
    }
    console.error('Error fetching JSON from S3:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result from S3' },
      { status: 500 }
    );
  }
}
