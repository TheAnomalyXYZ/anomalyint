import svgPaths from "./svg-hzfw16ygn3";
import { imgVector } from "./svg-bqncy";

function A() {
  return (
    <div className="absolute contents inset-0" data-name="a">
      <div className="absolute inset-[0_0_0_26.66%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-12.799px_0px] mask-size-[48px_35.203px]" data-name="Vector" style={{ maskImage: `url('${imgVector}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.2009 35.2031">
          <path d={svgPaths.p927d000} fill="var(--fill-0, #A192F8)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[0_26.66%_0_0] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_0px] mask-size-[48px_35.203px]" data-name="Vector_2" style={{ maskImage: `url('${imgVector}')` }}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.2009 35.2031">
          <path d={svgPaths.p17307300} fill="var(--fill-0, #A192F8)" id="Vector_2" />
        </svg>
      </div>
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="absolute contents inset-0" data-name="Clip path group">
      <A />
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[35.203px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <ClipPathGroup />
    </div>
  );
}

function A1() {
  return (
    <div className="absolute content-stretch flex flex-col h-[35.203px] items-start left-0 top-0 w-[48px]" data-name="A">
      <Icon />
    </div>
  );
}

function Novalink() {
  return (
    <div className="absolute contents inset-0" data-name="NOVALINK">
      <div className="absolute inset-[25.26%_88.36%_2.23%_0]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6449 12.7121">
          <path d={svgPaths.p1364b030} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[25.26%_71.95%_0_14.95%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1037 13.1028">
          <path d={svgPaths.p38700100} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[25.26%_58.03%_0.59%_29.67%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.2962 12.9986">
          <path d={svgPaths.p151a1740} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[25.26%_44.26%_0_43.57%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.1657 13.1028">
          <path d={svgPaths.p293de200} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[1.49%_36.77%_1.19%_59.9%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.33455 17.0623">
          <path d={svgPaths.p25545d70} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[0_30.18%_1.19%_65.89%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.93373 17.3228">
          <path d={svgPaths.p2b7bd370} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[25.26%_15.29%_2.23%_73.07%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6449 12.7121">
          <path d={svgPaths.p6498800} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
      <div className="absolute inset-[1.49%_0_1.19%_88.36%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.6449 17.0623">
          <path d={svgPaths.p23f48b80} fill="var(--fill-0, #1A1A2E)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="h-[17.531px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Novalink />
    </div>
  );
}

function Novalink1() {
  return (
    <div className="absolute content-stretch flex flex-col h-[17.531px] items-start left-[60px] top-[5.84px] w-[100px]" data-name="Novalink">
      <Icon1 />
    </div>
  );
}

export default function Container() {
  return (
    <div className="relative size-full" data-name="Container">
      <A1 />
      <Novalink1 />
    </div>
  );
}