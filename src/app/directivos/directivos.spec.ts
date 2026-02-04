import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Directivos } from './directivos';

describe('Directivos', () => {
  let component: Directivos;
  let fixture: ComponentFixture<Directivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directivos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Directivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
