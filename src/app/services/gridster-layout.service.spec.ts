import { TestBed } from '@angular/core/testing';

import { GridsterLayoutService } from './gridster-layout.service';

describe('GridsterLayoutService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GridsterLayoutService = TestBed.get(GridsterLayoutService);
    expect(service).toBeTruthy();
  });
});
