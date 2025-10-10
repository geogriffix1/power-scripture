import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  standalone: true,
  template: `
  @if (true) {
    <div @key(refreshToken)>Test Block</div>
  }`
})
export class Test {

}
