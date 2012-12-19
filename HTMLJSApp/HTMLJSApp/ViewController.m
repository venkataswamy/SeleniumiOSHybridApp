//
//  ViewController.m
//  HTMLJSApp
//
//  Created by saurabh_gangarde on 01/08/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad
{
    [super viewDidLoad];
	
    NSString* filePath = [self pathForWebResource:@"index.html" inDirectory:@"www"];
    
    NSLog(@"Path: %@", filePath);
    
    NSURL *appURL = [NSURL fileURLWithPath:filePath];
    NSURLRequest *appReq = [NSURLRequest requestWithURL:appURL];
    [self.webView loadRequest:appReq];
}

/**
 * This method is already available with PhoneGap. But as I am not using PhoneGap so I am copying it
 * as helper method here.
 */
-(NSString*) pathForWebResource: (NSString*) resource inDirectory: (NSString*) directory{
    NSMutableArray *directoryParts = [NSMutableArray arrayWithArray:[resource componentsSeparatedByString:@"/"]];
    [directoryParts removeLastObject];
    
    NSString* directoryPartsJoined =[directoryParts componentsJoinedByString:@"/"];
    NSString* directoryStr = directory;
    
    if ([directoryPartsJoined length] > 0) {
        directoryStr = [NSString stringWithFormat:@"%@/%@", directory, [directoryParts componentsJoinedByString:@"/"]];
    }
    
    NSLog(@"directoryStr: %@", directoryStr);   
    
    NSString *filePath = [[NSBundle mainBundle] pathForResource:resource ofType:@"" inDirectory:directoryStr];
    
    return filePath;
}

- (void)viewDidUnload
{
    [super viewDidUnload];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return [super shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}

#pragma UIWebViewDelegate implementation

- (void) webViewDidFinishLoad:(UIWebView*) theWebView 
{
    NSLog(@"in function webViewDidFinishLoad");
}

-(void) webViewDidStartLoad:(UIWebView *)webView{
    NSLog(@"in function webViewDidStartLoad");
}

// You can rest of the UIWebViewDelegate method if you need.
- (BOOL)webView:(UIWebView *)theWebView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType 
{
    /* If hyperlink is clicked in application you expect that to open in external browser. This code can do that job */
//    if (![[[request URL] absoluteString] hasPrefix:@"webdriver"]){
//        if (![[UIApplication sharedApplication] openURL:[request URL]])
//            NSLog(@"%@%@",@"Failed to open url:",[[request URL] description]);
//        return NO;
//    }
    
    return [super webView:theWebView shouldStartLoadWithRequest:request navigationType:navigationType];
}




@end
