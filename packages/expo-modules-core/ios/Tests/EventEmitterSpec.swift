import ExpoModulesTestCore

@testable import ExpoModulesCore

final class EventEmitterSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    describe("JS class") {
      it("exists") {
        let eventEmitterClass = try runtime.eval("expo.EventEmitter")
        expect(eventEmitterClass.kind) == .function
      }

      it("has functions in prototype") {
        let prototype = try runtime.eval("expo.EventEmitter.prototype").asObject()
        let addListener = prototype.getProperty("addListener")
        let removeListener = prototype.getProperty("removeListener")
        let removeAllListeners = prototype.getProperty("removeAllListeners")
        let emit = prototype.getProperty("emit")

        expect(addListener.kind) == .function
        expect(removeListener.kind) == .function
        expect(removeAllListeners.kind) == .function
        expect(emit.kind) == .function
      }

      it("creates an instance") {
        let eventEmitter = try runtime.eval("new expo.EventEmitter()")
        expect(eventEmitter.kind) == .object
      }

      it("calls a listener") {
        let result = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "result = null",
          "emitter.addListener('test', payload => { result = payload })",
          "emitter.emit('test', 'it\\'s a payload')",
          "result"
        ])
        expect(result.kind) == .string
        expect(try result.asString()) == "it's a payload"
      }

      it("removes a listener") {
        let result = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "result = null",
          "listener = () => { result = 1 }",
          "emitter.addListener('test', listener)",
          "emitter.removeListener('test', listener)",
          "emitter.emit('test')",
          "result"
        ])
        expect(result.kind) == .null
      }

      it("removes all listeners") {
        let result = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "result = null",
          "emitter.addListener('test', () => { result = 1 })",
          "emitter.addListener('test', () => { result = 2 })",
          "emitter.removeAllListeners('test')",
          "emitter.emit('test')",
          "result"
        ])
        expect(result.kind) == .null
      }

      it("emits with multiple arguments") {
        let args = try runtime
          .eval([
            "emitter = new expo.EventEmitter()",
            "result = null",
            "emitter.addListener('test', (a, b, c) => { result = [a, b, c] })",
            "emitter.emit('test', 14, 2, 24)",
            "result"
          ])
          .asArray()
          .compactMap({ try $0?.asInt() })

        expect(args.count) == 3
        expect(args[0]) == 14
        expect(args[1]) == 2
        expect(args[2]) == 24
      }

      it("calls startObserving on addListener") {
        waitUntil { done in
          let eventName = "testEvent"
          let (emitter, listener) = setupEventObserver(runtime: runtime, functionName: "startObserving") { arguments in
            expect(try arguments.first?.asString()) == eventName
            done()
          }

          try! emitter
            .getProperty("addListener")
            .asFunction()
            .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)
        }
      }

      it("calls stopObserving on removeListener") {
        waitUntil { done in
          let eventName = "testEvent"
          let (emitter, listener) = setupEventObserver(runtime: runtime, functionName: "stopObserving") { arguments in
            expect(try arguments.first?.asString()) == eventName
            done()
          }

          try! emitter
            .getProperty("addListener")
            .asFunction()
            .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)

          try! emitter
            .getProperty("removeListener")
            .asFunction()
            .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)
        }
      }

      it("calls startObserving on addListener only once") {
        var calls: Int = 0
        let eventName = "testEvent"
        let (emitter, listener) = setupEventObserver(runtime: runtime, functionName: "startObserving") { arguments in
          calls = calls + 1
        }

        try! emitter
          .getProperty("addListener")
          .asFunction()
          .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)

        try! emitter
          .getProperty("addListener")
          .asFunction()
          .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)

        expect(calls) == 1
      }

      it("calls stopObserving on removeListener only once") {
        var calls: Int = 0
        let eventName = "testEvent"
        let (emitter, listener) = setupEventObserver(runtime: runtime, functionName: "stopObserving") { arguments in
          calls = calls + 1
        }

        try! emitter
          .getProperty("addListener")
          .asFunction()
          .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)

        try! emitter
          .getProperty("removeListener")
          .asFunction()
          .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)

        try! emitter
          .getProperty("removeListener")
          .asFunction()
          .call(withArguments: [eventName, listener], thisObject: emitter, asConstructor: false)

        expect(calls) == 1
      }
    }
  }
}

func setupEventObserver(
  runtime: ExpoRuntime,
  functionName: String,
  callback: @escaping (_ arguments: [JavaScriptValue]) throws -> Void
) -> (emitter: JavaScriptObject, listener: JavaScriptObject) {
  let emitter = try! runtime.eval("new expo.EventEmitter()").asObject()
  let listener = runtime.createSyncFunction("listener") { _, _ in }
  let observingFunction = runtime.createSyncFunction(functionName) { [callback] this, arguments in
    try callback(arguments)
    return Optional<Any>.none as Any
  }

  emitter.setProperty(functionName, value: observingFunction)

  return (emitter, listener)
}
