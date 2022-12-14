import { TestBed } from '@angular/core/testing';

import { VtsCommService } from './vts-comm.service';

describe('VtsCommService', () => {
  let service: VtsCommService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VtsCommService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
