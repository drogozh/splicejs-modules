require('splicejs-loader/splice.loader');

var assert = require('assert');

describe('Events test bootstrap', function() {
    it('Ok', function() {
        assert.equal(1,1);
    });
});

define([
    '../lib/events'
],function(events){

    describe('Multicast Event', function(){
        it('Event is callable', function(){
            var event = new events.MulticastEvent();
            if(typeof(event.call) != 'function'){
                assert.fail();
            }
            //assert.pass();
        });
        
        it('Event is subscribable', function(){
            var event = new events.MulticastEvent();
            if(typeof(event.subscribe) != 'function'){
                assert.fail();
            }
        });

        it('Event is un-subscribable', function(){
            var event = new events.MulticastEvent();
            if(typeof(event.unsubscribe) != 'function'){
                assert.fail();
            }
        });

        it('Event is disposable', function(){
            var event = new events.MulticastEvent();
            if(typeof(event.dispose) != 'function'){
                assert.fail();
            }
        });

        it('Subscription must return Subscription object', function(){
            var event = new events.MulticastEvent();
            var subscription = event.subscribe(function(){
                //do nothing
            });

            if(subscription == null){
                assert.fail();
            }
        });

        it('Disabled subscription must not invoke its callback', function(){
            var event = new events.MulticastEvent();
            var result= [];
            var subscription = event.subscribe(function(value){
                //do nothing
                result.push(value);
            });
            subscription.enable(false);
            event(1);
            if(result.length > 0){
                assert.fail();
            }
        });

        it('Disabling and enabling subscription should have net-zero effect', function(){
            var event = new events.MulticastEvent();
            var result= [];
            var subscription = event.subscribe(function(value){
                //do nothing
                result.push(value);
            });
            subscription.enable(false);
            subscription.enable(true);
            event(1);
            if(result.length != 1 || result[0] != 1){
                assert.fail();
            }
        });

        it('It should unsubscribe only particular subscription from event', function(){
            var event = new events.MulticastEvent();
            var result = [];
            var sub1 = event.subscribe(function(value){
                result.push(2);
            });
            var sub2 = event.subscribe(function(value){
                result.push(value);
            });

            event.unsubscribe(sub1);
            event(1);
            
            if(result.length != 1) {
                assert.fail();
            }
        });

        it('Event must not allow recursive subscription to itself, must throw exception', function(){
            var event = new events.MulticastEvent();
            try {
                event.subscribe(event);
                assert.fail();
            } catch(ex){}
        });

        it('Event must invoke multiple callbacks when raised', function(){
            var event = new events.MulticastEvent();
            var result = [];
            event.subscribe(function(value){
                result.push(value);
            });
            event.subscribe(function(value){
                result.push(value);
            });
            event(1);

            if(result[0] + result[1] != 2){
                assert.fail();
            }
        });
    });


    describe('Unicast Event', function(){
        it('Event is callable', function(){
            var event = new events.UnicastEvent();
            if(typeof(event.call) != 'function'){
                assert.fail();
            }
        });
        
        it('Event is subscribable', function(){
            var event = new events.UnicastEvent();
            if(typeof(event.subscribe) != 'function'){
                assert.fail();
            }
        });

        it('Event is un-subscribable', function(){
            var event = new events.UnicastEvent();
            if(typeof(event.unsubscribe) != 'function'){
                assert.fail();
            }
        });

        it('Event is disposable', function(){
            var event = new events.UnicastEvent();
            if(typeof(event.dispose) != 'function'){
                assert.fail();
            }
        });

        it('Subscription must return Subscription object', function(){
            var event = new events.UnicastEvent();
            var subscription = event.subscribe(function(){
                //do nothing
            });

            if(subscription == null){
                assert.fail();
            }
        });

        it('It should unsubscribe from event', function(){
            var event = new events.UnicastEvent();
            var result = [];
            var sub = event.subscribe(function(value){
                result.push(value);
            });
            event.unsubscribe(sub);
            event(1);
            
            if(result.length > 0) {
                assert.fail();
            }
        });

        it('Event must not allow recursive subscription to itself, must throw exception', function(){
            var event = new events.UnicastEvent();
            try {
                event.subscribe(event);
                assert.fail();
            } catch(ex){}
        });


        it('Event must invoke single and last subscriber', function(){
            var event = new events.UnicastEvent();
            var result = [];
            event.subscribe(function(value){
                result.push(2);
            });
            event.subscribe(function(value){
                result.push(value);
            });
            event(1);

            if(result.length !=1 || result[0] != 1){
                assert.fail();
            }
        });
    });

});