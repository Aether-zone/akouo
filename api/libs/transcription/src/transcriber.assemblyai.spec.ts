import { AssemblyAiTranscriber } from './transcriber.assemblyai';

const recording = {
  id: 'recording-1',
  file: { id: 'file-1', originalName: 'a.mp3', size: 10 },
} as never;

const meeting = { participants: [{}, {}] } as never;

const transcript = {
  status: 'completed',
  id: 'transcript-1',
  text: 'hello',
  utterances: [
    { speaker: 'A', text: 'hello', confidence: 0.9, start: 0, end: 10 },
  ],
};

/**
 * The transcriber with AssemblyAI and the file store stubbed. The AssemblyAI
 * client is replaced after construction, because the constructor builds a real
 * one from the api key.
 */
function harness(fetchesFromStore: boolean) {
  const fileService = {
    getUrl: jest.fn().mockResolvedValue('http://store/signed'),
    openStream: jest.fn().mockResolvedValue('a-stream'),
    findById: jest.fn().mockResolvedValue({ id: 'file-1' }),
  };

  const config = {
    get: (key: string) =>
      key === 'ASSEMBLYAI_API_KEY' ? 'key' : fetchesFromStore,
  };

  const transcriber = new AssemblyAiTranscriber(
    config as never,
    fileService as never,
  );

  const upload = jest.fn().mockResolvedValue('http://assemblyai/uploaded');
  const transcribe = jest.fn().mockResolvedValue(transcript);

  (transcriber as unknown as { client: unknown }).client = {
    files: { upload },
    transcripts: { transcribe },
  };

  return { transcriber, fileService, upload, transcribe };
}

describe('when AssemblyAI can reach the store', () => {
  it('points the job at a presigned URL and moves no bytes', async () => {
    const { transcriber, fileService, upload, transcribe } = harness(true);

    await transcriber.transcribe(recording, meeting);

    expect(fileService.getUrl).toHaveBeenCalledWith('file-1');
    expect(fileService.openStream).not.toHaveBeenCalled();
    expect(upload).not.toHaveBeenCalled();
    expect(transcribe.mock.calls[0][0]).toMatchObject({
      audio: 'http://store/signed',
    });
  });
});

describe('when it cannot', () => {
  it('reads the recording and uploads it, whichever store holds it', async () => {
    const { transcriber, fileService, upload, transcribe } = harness(false);

    await transcriber.transcribe(recording, meeting);

    // `openStream` is backend-aware, so this path works for loculus too.
    expect(fileService.openStream).toHaveBeenCalled();
    expect(fileService.getUrl).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith('a-stream');
    expect(transcribe.mock.calls[0][0]).toMatchObject({
      audio: 'http://assemblyai/uploaded',
    });
  });
});

describe('either way', () => {
  it('asks for diarization sized to the participant list', async () => {
    const { transcriber, transcribe } = harness(true);

    await transcriber.transcribe(recording, meeting);

    expect(transcribe.mock.calls[0][0]).toMatchObject({
      speaker_labels: true,
      speakers_expected: 2,
    });
  });

  it('drops utterances with no words in them', async () => {
    const { transcriber, transcribe } = harness(true);
    transcribe.mockResolvedValue({
      ...transcript,
      utterances: [...transcript.utterances, { speaker: 'B', text: '  ', confidence: 1, start: 0, end: 1 }],
    });

    const result = await transcriber.transcribe(recording, meeting);

    expect(result.utterances).toHaveLength(1);
  });

  it('raises a failed transcript rather than returning an empty one', async () => {
    const { transcriber, transcribe } = harness(true);
    transcribe.mockResolvedValue({ status: 'error', error: 'no audio' });

    await expect(transcriber.transcribe(recording, meeting)).rejects.toThrow(
      'no audio',
    );
  });
});
