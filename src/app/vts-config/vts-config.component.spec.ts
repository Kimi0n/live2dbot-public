import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VtsConfigComponent } from './vts-config.component';

describe('VtsConfigComponent', () => {
  let component: VtsConfigComponent;
  let fixture: ComponentFixture<VtsConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VtsConfigComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VtsConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
