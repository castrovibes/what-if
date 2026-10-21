// Mouse events for the iOS Simulator window, in Mac screen points.
// Built on demand by ../sim into .build/events (git-ignored). Needs Accessibility
// permission for the terminal that runs it (System Settings > Privacy & Security).
//
//   events window                      prints "x y w h id" of the Simulator window
//   events tap X Y                     click
//   events drag X1 Y1 X2 Y2 [ms]       press, move over `ms` milliseconds (default 300), release
//   events move X Y                    move the pointer only (for checking a calibration by eye)
import Foundation
import CoreGraphics
import AppKit

func fail(_ msg: String) -> Never {
  FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
  exit(1)
}

// Clicks go to whatever window is under the pointer, so the Simulator must be in front.
// (This takes focus from the editor; it is the same trade-off every CGEvent driver makes.)
func bringSimulatorToFront() {
  let bundle = "com.apple.iphonesimulator"
  guard let sim = NSRunningApplication.runningApplications(withBundleIdentifier: bundle).first else {
    fail("Simulator is not running")
  }
  if NSWorkspace.shared.frontmostApplication?.bundleIdentifier == bundle { return }
  sim.activate(options: [.activateIgnoringOtherApps])
  for _ in 0..<20 {
    usleep(50_000)
    if NSWorkspace.shared.frontmostApplication?.bundleIdentifier == bundle { usleep(150_000); return }
  }
  // Cooperative activation can refuse a background process; AppleScript's activate does not.
  let p = Process()
  p.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
  p.arguments = ["-e", "tell application \"Simulator\" to activate"]
  try? p.run(); p.waitUntilExit()
  usleep(250_000)
}

func post(_ type: CGEventType, _ p: CGPoint) {
  let e = CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: p, mouseButton: .left)
  e?.post(tap: .cghidEventTap)
}

func num(_ s: String) -> Double {
  guard let v = Double(s) else { fail("not a number: \(s)") }
  return v
}

let a = CommandLine.arguments
guard a.count >= 2 else { fail("usage: events window | tap X Y | drag X1 Y1 X2 Y2 [ms] | move X Y") }

switch a[1] {
case "window":
  let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as! [[String: Any]]
  // The device window is the Simulator-owned window with the largest area (menus and
  // the "Simulator" settings window are smaller).
  var best: (Double, [String: Any])? = nil
  for w in list where (w["kCGWindowOwnerName"] as? String) == "Simulator" {
    guard let b = w["kCGWindowBounds"] as? [String: Double], (w["kCGWindowLayer"] as? Int ?? 0) == 0 else { continue }
    let area = b["Width"]! * b["Height"]!
    if best == nil || area > best!.0 { best = (area, w) }
  }
  guard let w = best?.1, let b = w["kCGWindowBounds"] as? [String: Double] else { fail("no Simulator window on screen") }
  print(b["X"]!, b["Y"]!, b["Width"]!, b["Height"]!, w["kCGWindowNumber"] as! Int, w["kCGWindowName"] as? String ?? "")
case "move":
  guard a.count >= 4 else { fail("usage: events move X Y") }
  post(.mouseMoved, CGPoint(x: num(a[2]), y: num(a[3])))
case "tap":
  guard a.count >= 4 else { fail("usage: events tap X Y") }
  bringSimulatorToFront()
  let p = CGPoint(x: num(a[2]), y: num(a[3]))
  post(.mouseMoved, p); usleep(60_000)
  post(.leftMouseDown, p); usleep(80_000)
  post(.leftMouseUp, p)
case "drag":
  guard a.count >= 6 else { fail("usage: events drag X1 Y1 X2 Y2 [ms]") }
  bringSimulatorToFront()
  let p1 = CGPoint(x: num(a[2]), y: num(a[3]))
  let p2 = CGPoint(x: num(a[4]), y: num(a[5]))
  let ms = a.count > 6 ? num(a[6]) : 300
  let steps = max(8, Int(ms / 16))
  post(.mouseMoved, p1); usleep(60_000)
  post(.leftMouseDown, p1); usleep(80_000)
  for i in 1...steps {
    let t = Double(i) / Double(steps)
    post(.leftMouseDragged, CGPoint(x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t))
    usleep(UInt32(ms * 1000 / Double(steps)))
  }
  usleep(60_000)
  post(.leftMouseUp, p2)
default:
  fail("unknown command: \(a[1])")
}
