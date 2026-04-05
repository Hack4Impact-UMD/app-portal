import { CloudTasksClient, protos } from '@google-cloud/tasks';
import { logger } from 'firebase-functions';

type ITask = protos.google.cloud.tasks.v2.ITask;
type ICreateTaskRequest = protos.google.cloud.tasks.v2.ICreateTaskRequest;

let tasksClient: CloudTasksClient | null = null;

export interface GradingTaskPayload {
  jobId: string;
  responseId: string;
  repoURL: string;
  testRepo: string;
}

export function getCloudTasksClient(): CloudTasksClient {
  if (!tasksClient) {
    tasksClient = new CloudTasksClient();
    logger.info("Initialized Cloud Tasks client");
  }
  return tasksClient;
}

export function getQueuePath(): string {
  const projectId = process.env.GCP_PROJECT_ID;
  const region = process.env.GCP_REGION;
  const queueName = process.env.CLOUD_TASKS_QUEUE_NAME;

  if (!projectId || !region || !queueName) {
    throw new Error("Missing GCP env vars required for queue init");
  }

  const client = getCloudTasksClient();
  return client.queuePath(projectId, region, queueName);
}

export async function publishGradingTask(
  payload: GradingTaskPayload
): Promise<string> {
  const client = getCloudTasksClient();
  const queuePath = getQueuePath();

  const payloadBuffer = Buffer.from(JSON.stringify(payload));
  const body = payloadBuffer.toString('base64');

  const task: ITask = {
    httpRequest: {
      headers: {
        'Content-Type': 'application/json',
      },
      httpMethod: 'POST',
      body: body,
    },
  };

  logger.info(`Publishing task for job ${payload.jobId}`);

  try {
    const request: ICreateTaskRequest = {
      parent: queuePath,
      task: task,
    };
    
    const [response] = await client.createTask(request);

    logger.info(`Task created: ${response.name}`);
    return response.name!;
  } catch (error) {
    logger.error("Failed to publish task:", error);
    throw new Error("Failed to publish grading job to queue");
  }
}
