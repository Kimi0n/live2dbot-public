import { TestBed } from '@angular/core/testing';

import { VtsAuthService } from './vts-auth.service';

describe('VtsAuthService', () => {
  let service: VtsAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VtsAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
