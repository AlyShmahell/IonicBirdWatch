import { Injectable, EventEmitter } from '@angular/core';    
import { Subscription } from 'rxjs/internal/Subscription';    
    
@Injectable({    
  providedIn: 'root'    
})    

export class EventEmitterService {    
    
  invoke   = new EventEmitter();    
  subscribe:     Subscription;    
    
  constructor() { }    

  emit(src) { 
      console.log(`emitting from ${src}`)   
    this.invoke.emit();    
  }    
} 