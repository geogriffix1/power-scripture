import { Component, OnInit} from '@angular/core';
import { AngularSplitModule } from 'angular-split';
import { BibleThemeTreeComponent } from '../bible-theme-tree/bible-theme-tree.component';
import { RouterOutlet } from '@angular/router';
import { JstreeModel} from '../model/jstree.model';
import { WorkbenchComponent } from '../workbench/workbench.component';
import { fromEvent, Subscription, Subject } from 'rxjs';
import $ from 'jquery';

@Component({
    selector: 'app-mainshell',
    standalone: true,
    imports: [
        AngularSplitModule,
        BibleThemeTreeComponent,
        RouterOutlet
    ],
    templateUrl: './mainshell.component.html',
    styleUrl: './mainshell.component.css'
})
export class MainShellComponent implements OnInit {
  title = 'power-scripture';
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
      $(this).addClass("psmenu-down");
    }).on('mouseup', function(e) {
      if ($(this).hasClass("psmenu-down")) {
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
      MainShellComponent.keystrokeBroadcaster.next(result);
    });

    const mouseup = fromEvent(window, "mouseup");
    this.mouseupSubscription = mouseup.subscribe(result => {
      MainShellComponent.mouseupBroadcaster.next(result);
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

  constructor() {
    MainShellComponent.keystrokeBroadcaster = new Subject<Event>();
    MainShellComponent.mouseupBroadcaster = new Subject<Event>();
  }
}