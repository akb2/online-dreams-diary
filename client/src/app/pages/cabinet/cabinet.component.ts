import { Component } from '@angular/core';





@Component({
  selector: 'app-home',
  templateUrl: './cabinet.component.html',
  styleUrls: ['./cabinet.component.scss']
})





export class CabinetComponent {
  public cycle: number[] = Array(70).fill(0);
  public testText: string = "123";


  // Тест
  public test(text: string): void {
    console.log(text);
  }
}
