import * as PP from "../src/parser_pair"
import * as PR from "../src/parser_result"
import * as PT from "../src/parser_type"
import * as Maybe from "../src/maybe"
import * as APP from "../src/parser_applicative"
import {P, assert, display_one, display_two, display_three} from "./test_helpers"

import * as TM from "./test_monad"
import * as TL from "./test_liftA2"
import * as TA from "./test_ap" 
import * as TD from "./test_do" 
import * as TC from "./test_combinators"
import * as TP  from "./test_parser"
import * as TSP from "./test_string_primitives"

TM.test()
TL.test()
TA.test()
TD.test()
TC.test()
TP.test()
TSP.test()