//
//  UIWebViewController.h
//  HTMLJSApp
//
//  Created by saurabh_gangarde on 01/08/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface UIWebViewController : UIViewController <UIWebViewDelegate>
{
    IBOutlet UIWebView* webView;
}
@property (nonatomic, retain) UIWebView* webView;

@end