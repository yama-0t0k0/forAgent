// This file is the entry point for functions_framework.
import 'package:functions_framework/serve.dart';
import 'package:matching_functions/functions.dart' as function_library;

Future<void> main(List<String> args) async {
  await serve(args, (name) {
    if (name == 'calculateMatch') {
      return FunctionTarget.http(function_library.calculateMatch);
    }
    return null;
  });
}
