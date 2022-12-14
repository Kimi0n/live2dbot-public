import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwitchConfigComponent } from './twitch-config.component';

describe('TwitchConfigComponent', () => {
  let component: TwitchConfigComponent;
  let fixture: ComponentFixture<TwitchConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwitchConfigComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TwitchConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
