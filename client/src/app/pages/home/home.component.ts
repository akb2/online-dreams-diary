import { Component } from '@angular/core';





@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})





export class HomeComponent {
  public cycle: number[] = Array(70).fill(0);
  public testText: string = "123";


  // Тест
  public test(text: string): void {
    console.log(text);
  }
}
