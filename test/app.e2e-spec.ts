import { Readable } from 'stream';
import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module'; // Adjust path as needed

describe('UploadController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Utility to create a mock file stream
  function createCsvStream(content = 'name,email\nJohn Doe,john@example.com') {
    return Readable.from([content]);
  }

  it('should upload a valid CSV file successfully', async () => {
    const csvContent = 'name,email\nJohn Doe,john@example.com';

    const res = await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from(csvContent), 'sample.csv')
      .set('Authorization', 'Bearer valid-token'); // Add auth if needed

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Upload successful');
    expect(res.body).toHaveProperty('filename');
  });

  it('should fail when uploading a non-CSV file', async () => {
    const txtContent = 'This is a text file, not CSV';

    const res = await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from(txtContent), 'sample.txt')
      .set('Authorization', 'Bearer valid-token'); // Add auth if needed

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/only csv files/i);
  });

  it('should return error when no file is attached', async () => {
    const res = await request(app.getHttpServer())
      .post('/upload')
      .set('Authorization', 'Bearer valid-token'); // Add auth if needed

    expect(res.status).toBe(400); // Changed from 500 to 400 for BadRequestException
    expect(res.body.message).toBe('File is required.');
  });
});
