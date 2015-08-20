#!/usr/bin/perl

use strict;
use warnings;

use CGI;
use LWP::Simple;
my $q = CGI->new;
my $url = $q->param('url');;
my $content = get $url;
print $q->header;
die "Couldn't get $url" unless defined $content;
my $base = '<head><base href="'.$url.'">';
print $base.$content.'<small>by monsenhor</small>';
