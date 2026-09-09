import { MEETING_CREATED } from '@akouo/contract';

import { MeetingService } from './meeting.service';

const actor = { id: 'user-1', organizationId: 'org-1' } as never;
const request = { title: 'Standup', startDate: '2026-01-01T09:00:00Z', participants: [] };
const meeting = { id: 'meeting-1', title: 'Standup' };

function harness(publish = jest.fn().mockResolvedValue(undefined)) {
  const built = {
    leftJoinAndSelect: () => built,
    where: () => built,
    andWhere: () => built,
    orderBy: () => built,
    getOne: () => Promise.resolve({ id: 'meeting-1' }),
  };
  const meetingRepository = {
    create: (x: object) => x,
    save: jest.fn().mockResolvedValue({ id: 'meeting-1' }),
    createQueryBuilder: () => built,
  };
  const meetingMapper = { toDTO: () => meeting };

  const service = new MeetingService(
    meetingRepository as never,
    meetingMapper as never,
    { publish } as never,
  );

  return { service, publish, meetingRepository };
}

describe('create', () => {
  it('publishes meeting.created with the whole meeting', async () => {
    const { service, publish } = harness();

    await service.create(actor, request as never);

    const [routingKey, payload] = publish.mock.calls[0] as [
      string,
      { meeting: unknown },
    ];

    expect(routingKey).toBe(MEETING_CREATED);
    // The whole DTO, not an id: a subscriber cannot read akouo's database.
    expect(payload).toEqual({ meeting });
  });

  it('still returns the meeting when the broker is down', async () => {
    const { service } = harness(
      jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    // The row is already saved; a caller must not be told it failed because a
    // queue was unreachable.
    await expect(service.create(actor, request as never)).resolves.toEqual(
      meeting,
    );
  });

  it('announces the meeting and nothing else', async () => {
    // No credential travels with the event: it would be written to the
    // broker's disk and readable by anything that can read the queue.
    const { service, publish } = harness();

    await service.create(actor, request as never);

    expect(publish).toHaveBeenCalledWith(MEETING_CREATED, { meeting });
  });

  it('saves before it publishes, so nothing is announced that does not exist', async () => {
    const order: string[] = [];
    const publish = jest.fn(() => {
      order.push('publish');
      return Promise.resolve();
    });
    const { service, meetingRepository } = harness(publish);
    meetingRepository.save.mockImplementation(() => {
      order.push('save');
      return Promise.resolve({ id: 'meeting-1' });
    });

    await service.create(actor, request as never);

    expect(order).toEqual(['save', 'publish']);
  });
});
