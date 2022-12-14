import { TestBed } from '@angular/core/testing';

import { TwitchCommService } from './twitch-comm.service';

describe('TwitchCommService', () => {
  let service: TwitchCommService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TwitchCommService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
