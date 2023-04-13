import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import {P, assert, display_one, display_two, display_three} from "./test_helpers"

 import {test_monad} from "./test_monad"
 import {test_lift} from "./test_liftA2"
 import {test_ap} from "./test_ap" 
 import {test_do} from "./test_do" 
 import {test_combinators} from "./test_combinators"
 import {test_parser} from "./test_parser"
 import {test_string_primitives} from "./test_string_primitives"

 test_monad()
 test_lift()
 test_ap()
 test_do()
 test_combinators()
 test_parser()
 test_string_primitives()