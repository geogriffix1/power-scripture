import { Component, OnInit} from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { Router } from '@angular/router';
import { BibleThemeTreeComponent } from './bible-theme-tree/bible-theme-tree.component';
import { JstreeModel } from './model/jstree.model';
import { WorkbenchComponent } from './workbench/workbench.component';
import { fromEvent, Subscription, Subject } from 'rxjs';
import $ from 'jquery';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        AngularSplitModule,
        BibleThemeTreeComponent,
        WorkbenchComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'power-scripture';
  static router:Router;
  static keystrokeBroadcaster:Subject<any>;
  static mouseupBroadcaster:Subject<any>;
  static editObject?:JstreeModel;
  mouseupSubscription!:Subscription;
  keyupSubscription!:Subscription;
  resizeSubscription!:Subscription;

  windowHeight:number = 0;
  windowWidth:number = 0;
  topOffset:number = 0;
  top:number = 0;
  bottom:number = 0;
  left:number = 0;
  height:number = 0;
  width:number = 0;

  ngOnInit(): void {
    $('i.psmenu-icon').on('enter', function() {
      $(this).addClass("psmenu-icon-hover");
    }).on('leave', function() {
      $(this).removeClass("psmenu-icon-hover");
    });
    $('a.menu').on('mousedown', function(e) {
      console.log(e.currentTarget);
      //console.log(JSON.stringify(this));
      $(this).addClass("psmenu-down");
    }).on('mouseup', function(e) {
      if ($(this).hasClass("psmenu-down")) {
        // completes the click operation
        $(this).removeClass("psmenu-down");
        $('a.menu').removeClass("psmenu-click");
        $(this).addClass("psmenu-click");
      }
    }).on('mouseout', function(e) {
      $(this).removeClass("psmenu-down");
    });

    var mainNav = document.getElementById("mainNav");
    var topOffset = 0;
    if (mainNav && mainNav.offsetTop) {
      topOffset = mainNav.offsetTop;
    }
    
    if (mainNav && mainNav.offsetHeight) {
      topOffset += mainNav.offsetHeight;
    }

    this.topOffset = topOffset;
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
    this.onWindowResize();

    const resize = fromEvent(window, "resize");
    this.resizeSubscription = resize.subscribe(next => {
      this.windowHeight = window.innerHeight;
      this.windowWidth = window.innerWidth;
      this.onWindowResize();
    });

    const keyup = fromEvent(window, "keyup");
    this.keyupSubscription = keyup.subscribe(result => {
      AppComponent.keystrokeBroadcaster.next(result);
    });

    const mouseup = fromEvent(window, "mouseup");
    this.mouseupSubscription = mouseup.subscribe(result => {
      AppComponent.mouseupBroadcaster.next(result);
    })
  }

  ngOnDestroy():void {
    this.mouseupSubscription.unsubscribe();
    this.keyupSubscription.unsubscribe();
    this.resizeSubscription.unsubscribe();
  }

  onWindowResize = () => {
    this.bottom = Number((this.windowHeight * 0.04 + 0.5).toFixed());
    this.top = Number(this.topOffset);
    this.left = Number((this.windowWidth * 0.04 + 0.5).toFixed());
    this.height = window.innerHeight - this.top - this.bottom;
    this.width = window.innerWidth - this.left * 2;
  }

  constructor(router:Router) {
    AppComponent.keystrokeBroadcaster = new Subject<Event>();
    AppComponent.mouseupBroadcaster = new Subject<Event>();
    AppComponent.router = router;
  }
}