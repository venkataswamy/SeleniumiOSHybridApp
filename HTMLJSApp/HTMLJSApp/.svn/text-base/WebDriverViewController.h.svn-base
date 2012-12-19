//
//  WebDriverViewController.h
//  HTMLJSApp
//
//  Created by saurabh_gangarde on 01/08/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "UIWebViewController.h"

@interface WebDriverViewController : UIWebViewController
{
@private
// Used to track the number of page loads.  The view is considered loaded
// when there are no pending page loads.
int numPendingPageLoads_;

NSString *lastJSResult_;

NSURLRequestCachePolicy cachePolicy_;

// This is nil if the last operation succeeded.
NSError *lastError_;
}

- (void)waitForLoad;

- (CGRect)viewableArea;
- (BOOL)pointIsViewable:(CGPoint)point;

// Some webdriver stuff.
- (id)visible;
- (void)setVisible:(NSNumber *)target;

// Get the current page title
- (NSString *)currentTitle;

// Get the URL of the page we're looking at
- (NSString *)URL;

// Navigate to a URL.
// The URL should be specified by the |url| key in the |urlMap|.
- (void)setURL:(NSDictionary *)urlMap;

- (void)forward:(NSDictionary*)ignored;
- (void)back:(NSDictionary*)ignored;
- (void)refresh:(NSDictionary*)ignored;

- (void)frame:(NSDictionary*)frameTarget;

// Evaluate a javascript string and return the result.
// Arguments can be passed in in NSFormatter (printf) style.
//
// Variables declared with var are kept between script calls. However, they are
// lost when the page reloads. Check before using any variables which were
// defined during previous events.
- (NSString *)jsEval:(NSString *)format, ...;

// Get the HTML source of the page we've loaded
- (NSString *)source;

// Get a screenshot of the page we've loaded
- (UIImage *)screenshot;

- (void)clickOnPageElementAt:(CGPoint)point;

// Calls the same on the main view controller.
- (void)describeLastAction:(NSString *)status;

// Get geolocation
- (id)location;

// Set geolocation
- (void)setLocation:(NSDictionary *)dict;

// Check if browser connection is alive
- (NSNumber *)isBrowserOnline;

@end
