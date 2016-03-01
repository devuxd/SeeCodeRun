/* */ 
(function(process) {
  var http = require('http'),
      https = require('https'),
      aws4 = require('./aws4');
  var opts = {
    host: 'sqs.us-east-1.amazonaws.com',
    path: '/?Action=ListQueues'
  };
  opts = {
    service: 'sqs',
    region: 'us-east-1',
    path: '/?Action=ListQueues'
  };
  opts = {
    service: 'sqs',
    path: '/?Action=ListQueues'
  };
  aws4.sign(opts);
  console.log(opts);
  http.request(opts, function(res) {
    res.pipe(process.stdout);
  }).end();
  aws4.sign(opts, {
    accessKeyId: '',
    secretAccessKey: ''
  });
  aws4.sign({
    service: 's3',
    path: '/my-bucket?X-Amz-Expires=12345',
    signQuery: true
  });
  function request(o) {
    https.request(o, function(res) {
      res.pipe(process.stdout);
    }).end(o.body || '');
  }
  request(aws4.sign({
    service: 'iam',
    body: 'Action=ListGroups&Version=2010-05-08'
  }));
  request(aws4.sign({
    service: 'dynamodb',
    region: 'ap-southeast-2',
    method: 'POST',
    path: '/',
    headers: {
      'Content-Type': 'application/x-amz-json-1.0',
      'X-Amz-Target': 'DynamoDB_20120810.ListTables'
    },
    body: '{}'
  }));
  request(aws4.sign({
    service: 's3',
    path: '/',
    signQuery: true
  }));
  request(aws4.sign({
    service: 'ec2',
    path: '/?Action=DescribeRegions&Version=2014-06-15'
  }));
  request(aws4.sign({
    service: 'sns',
    path: '/?Action=ListTopics&Version=2010-03-31'
  }));
  request(aws4.sign({
    service: 'sts',
    path: '/?Action=GetSessionToken&Version=2011-06-15'
  }));
  request(aws4.sign({
    service: 'cloudsearch',
    path: '/?Action=ListDomainNames&Version=2013-01-01'
  }));
  request(aws4.sign({
    service: 'ses',
    path: '/?Action=ListIdentities&Version=2010-12-01'
  }));
  request(aws4.sign({
    service: 'autoscaling',
    path: '/?Action=DescribeAutoScalingInstances&Version=2011-01-01'
  }));
  request(aws4.sign({
    service: 'elasticloadbalancing',
    path: '/?Action=DescribeLoadBalancers&Version=2012-06-01'
  }));
  request(aws4.sign({
    service: 'cloudformation',
    path: '/?Action=ListStacks&Version=2010-05-15'
  }));
  request(aws4.sign({
    service: 'elasticbeanstalk',
    path: '/?Action=ListAvailableSolutionStacks&Version=2010-12-01'
  }));
  request(aws4.sign({
    service: 'rds',
    path: '/?Action=DescribeDBInstances&Version=2012-09-17'
  }));
  request(aws4.sign({
    service: 'monitoring',
    path: '/?Action=ListMetrics&Version=2010-08-01'
  }));
  request(aws4.sign({
    service: 'redshift',
    path: '/?Action=DescribeClusters&Version=2012-12-01'
  }));
  request(aws4.sign({
    service: 'cloudfront',
    path: '/2014-05-31/distribution'
  }));
  request(aws4.sign({
    service: 'elasticache',
    path: '/?Action=DescribeCacheClusters&Version=2014-07-15'
  }));
  request(aws4.sign({
    service: 'elasticmapreduce',
    path: '/?Action=DescribeJobFlows&Version=2009-03-31'
  }));
  request(aws4.sign({
    service: 'route53',
    path: '/2013-04-01/hostedzone'
  }));
  request(aws4.sign({
    service: 'appstream',
    path: '/applications'
  }));
  request(aws4.sign({
    service: 'cognito-sync',
    path: '/identitypools'
  }));
  request(aws4.sign({
    service: 'elastictranscoder',
    path: '/2012-09-25/pipelines'
  }));
  request(aws4.sign({
    service: 'lambda',
    path: '/2014-11-13/functions/'
  }));
  request(aws4.sign({
    service: 'ecs',
    path: '/?Action=ListClusters&Version=2014-11-13'
  }));
  request(aws4.sign({
    service: 'glacier',
    path: '/-/vaults',
    headers: {'X-Amz-Glacier-Version': '2012-06-01'}
  }));
  request(aws4.sign({
    service: 'storagegateway',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'StorageGateway_20120630.ListGateways'
    }
  }));
  request(aws4.sign({
    service: 'datapipeline',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'DataPipeline.ListPipelines'
    }
  }));
  request(aws4.sign({
    service: 'opsworks',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'OpsWorks_20130218.DescribeStacks'
    }
  }));
  request(aws4.sign({
    service: 'route53domains',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Route53Domains_v20140515.ListDomains'
    }
  }));
  request(aws4.sign({
    service: 'kinesis',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Kinesis_20131202.ListStreams'
    }
  }));
  request(aws4.sign({
    service: 'cloudtrail',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'CloudTrail_20131101.DescribeTrails'
    }
  }));
  request(aws4.sign({
    service: 'logs',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Logs_20140328.DescribeLogGroups'
    }
  }));
  request(aws4.sign({
    service: 'codedeploy',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'CodeDeploy_20141006.ListApplications'
    }
  }));
  request(aws4.sign({
    service: 'directconnect',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'OvertureService.DescribeConnections'
    }
  }));
  request(aws4.sign({
    service: 'kms',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'TrentService.ListKeys'
    }
  }));
  request(aws4.sign({
    service: 'config',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'StarlingDoveService.DescribeDeliveryChannels'
    }
  }));
  request(aws4.sign({
    service: 'cloudhsm',
    body: '{}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'CloudHsmFrontendService.ListAvailableZones'
    }
  }));
  request(aws4.sign({
    service: 'swf',
    body: '{"registrationStatus":"REGISTERED"}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.0',
      'X-Amz-Target': 'SimpleWorkflowService.ListDomains'
    }
  }));
  request(aws4.sign({
    service: 'cognito-identity',
    body: '{"MaxResults": 1}',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityService.ListIdentityPools'
    }
  }));
  request(aws4.sign({
    service: 'mobileanalytics',
    path: '/2014-06-05/events',
    body: JSON.stringify({events: [{
        eventType: 'a',
        timestamp: new Date().toISOString(),
        session: {}
      }]}),
    headers: {
      'Content-Type': 'application/json',
      'X-Amz-Client-Context': JSON.stringify({
        client: {
          client_id: 'a',
          app_title: 'a'
        },
        custom: {},
        env: {platform: 'a'},
        services: {}
      })
    }
  }));
})(require('process'));
