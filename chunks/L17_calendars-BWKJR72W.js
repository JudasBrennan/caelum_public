import{a as s,b as e,c as q,d as i,e as y,f as l,g as p,h as d,i as D,j as S,k as C}from"./chunk-L3XYPVN7.js";import{j as _}from"./chunk-T2JC7ILW.js";import"./chunk-VC46IEJQ.js";function I(a){return[l("Days, Months, and Years",`<p>The three most natural units of time come from three astronomical
        cycles:</p>
      <ul>
        <li><strong>Day</strong> -- one rotation of the planet on its axis.
            On Earth, that is about 24 hours.</li>
        <li><strong>Month</strong> -- one orbit of a moon around the planet.
            Earth's Moon takes about 29.5 days to go through a full cycle
            of phases (new moon to new moon).</li>
        <li><strong>Year</strong> -- one orbit of the planet around its star.
            Earth's year is about 365.25 days.</li>
      </ul>
      <p>The trouble is that these cycles do not divide evenly into each
        other. A year is not exactly 365 days; a month is not exactly 30
        days. This mismatch is the reason calendars are complicated.</p>
      ${p("Imagine three gears of different sizes all turning together. They never quite line up at the same time. A calendar is an attempt to keep track of all three gears despite their awkward ratios.")}
      ${d("A day is one spin, a month is one moon orbit, a year is one orbit around the star. These cycles do not divide evenly, which is why calendars need corrections.")}`,`<p>The fundamental periods are:</p>
      <ul>
        <li><strong>Sidereal day</strong> -- one full rotation relative to
            the stars. For Earth, 23 h 56 m 4.1 s.</li>
        <li><strong>Solar day</strong> -- the time between successive solar
            noons. Slightly longer than the sidereal day because the planet
            has moved along its orbit and must rotate a bit further to face
            the star again.</li>
        <li><strong>Sidereal month</strong> -- one lunar orbit relative to
            the stars (27.322 d for the Moon).</li>
        <li><strong>Synodic month</strong> -- one cycle of lunar phases
            (29.531 d), longer because the planet has moved along its orbit
            during the month.</li>
      </ul>
      <p>The relationship between sidereal and solar day:</p>
      ${s("\\frac{1}{P_{\\text{solar}}} = \\frac{1}{P_{\\text{sid}}} - \\frac{1}{P_{\\text{orb}}}")}
      ${q([["P_{\\text{solar}}","solar day (mean)"],["P_{\\text{sid}}","sidereal rotation period"],["P_{\\text{orb}}","orbital period (year)"]])}
      <p>The synodic month is related to the sidereal month by the same
        principle:</p>
      ${s("\\frac{1}{P_{\\text{syn}}} = \\frac{1}{P_{\\text{sid,moon}}} - \\frac{1}{P_{\\text{orb}}}")}
      ${i("Meeus (1991), Astronomical Algorithms, Ch. 47; Seidelmann (1992), Explanatory Supplement to the Astronomical Almanac")}`,a),l("Calendar Types",`<p>Throughout history, different civilisations have chosen different
        astronomical cycles as the foundation of their calendars:</p>
      <ul>
        <li><strong>Solar calendar</strong> -- tracks the year (planet's
            orbit). The months are artificial divisions that do not follow
            the moon. The Gregorian calendar used worldwide today is a solar
            calendar.</li>
        <li><strong>Lunar calendar</strong> -- tracks the moon's phases.
            Each month starts with a new moon. The Islamic Hijri calendar is
            a purely lunar calendar. Because 12 lunar months are only about
            354 days, a lunar calendar drifts through the seasons.</li>
        <li><strong>Lunisolar calendar</strong> -- tracks both the moon and
            the seasons by occasionally inserting an extra month (called an
            intercalary month). The Hebrew, Chinese, and Hindu calendars
            are lunisolar.</li>
      </ul>
      ${p("A solar calendar is like setting your watch by the sun alone. A lunar calendar sets it by the moon alone. A lunisolar calendar tries to follow both, which requires periodic corrections -- like resetting your watch every so often to keep both hands aligned.")}
      ${d("Solar calendars track the year, lunar calendars track the moon, and lunisolar calendars track both by adding occasional extra months.")}`,`<p>The fundamental challenge of calendar design is the
        incommensurability of astronomical periods. Key ratios for
        Earth:</p>
      ${y(["Ratio","Value","Implication"],[["Days per year","365.2422","Need leap days"],["Synodic months per year","12.3683","Need intercalary months (lunisolar)"],["Days per synodic month","29.5306","Months alternate 29 and 30 days"]])}
      <p><strong>Solar intercalation:</strong> The Gregorian leap rule adds
        1 day every 4 years, skips centuries, but keeps 400ths:
        ${e("\\lfloor Y/4 \\rfloor - \\lfloor Y/100 \\rfloor + \\lfloor Y/400 \\rfloor")}
        leap days in ${e("Y")} years. This gives a mean year of
        365.2425 days (error: 1 day in ~3,236 years).</p>
      <p><strong>Lunar drift:</strong> A purely lunar calendar of 12
        months drifts by ${e("365.2422 - 354.3671 \\approx 10.875")}
        days per year relative to the solar year.</p>
      <p><strong>Metonic cycle:</strong> 19 solar years
        ${e("\\approx")} 235 synodic months (error: ~2 hours). Lunisolar
        calendars use this to decide when to insert a 13th month:
        7 intercalary months in every 19-year cycle.</p>
      ${i("Dershowitz & Reingold (2018), Calendrical Calculations: The Ultimate Edition, Cambridge Univ. Press")}`,a),l("Leap Cycles",`<p>A year is rarely an exact number of days. Earth's year is about
        365.2422 days -- that extra quarter-day is why we need a
        <strong>leap day</strong> every four years.</p>
      <p>But even the "one leap day every four years" rule is not perfect.
        It makes the average year 365.25 days, which is slightly too long.
        The Gregorian calendar fixes this by skipping the leap day in most
        century years (1700, 1800, 1900 were not leap years) but keeping
        it in years divisible by 400 (2000 was a leap year).</p>
      <p>On an alien world, the days-per-year value would be completely
        different, and the calendar designers would need to find their own
        optimal leap-day pattern.</p>
      ${p("Imagine you are stacking bricks to match a wall that is 365.24 bricks tall. Each brick is exactly 1 unit. You stack 365 and you are a little short. Every fourth course you add an extra brick -- but now you are a little too tall. So every hundred courses you skip one extra brick, and every four hundred you add it back. These corrections keep you as close to the true height as possible.")}
      ${d("Leap days correct the mismatch between whole-number day counts and the true length of the year. More complex leap rules give better accuracy.")}`,`<p>Finding the optimal leap-day rule for an arbitrary year length is
        equivalent to finding the best rational approximation to the
        fractional part of the days-per-year value. The
        <strong>continued fraction</strong> expansion provides the
        mathematically optimal sequence of approximants (convergents).</p>
      <p>For a fractional part ${e("f = Y - \\lfloor Y \\rfloor")}, the
        continued fraction expansion:</p>
      ${s("f = \\cfrac{1}{a_1 + \\cfrac{1}{a_2 + \\cfrac{1}{a_3 + \\cdots}}}")}
      <p>produces convergents ${e("p_n / q_n")} that satisfy:</p>
      ${s("\\left| f - \\frac{p_n}{q_n} \\right| < \\frac{1}{q_n \\cdot q_{n+1}}")}
      <p>Each convergent gives the best rational approximation with a
        denominator at or below ${e("q_n")}. The interpretation is:
        "add ${e("p_n")} leap days every ${e("q_n")} years."</p>
      <p>For Earth (${e("f \\approx 0.2422")}):</p>
      ${y(["Convergent","Rule","Mean year (d)","Error (d/cycle)"],[["1/4","1 leap day per 4 yr","365.2500","0.0312"],["8/33","8 leap days per 33 yr","365.2424","0.0007"],["97/401","97 leap days per 401 yr","365.24189","0.012"]])}
      <p>The Gregorian rule (97/400) is very close to the 97/401
        convergent but uses a round-number cycle length, sacrificing
        minimal accuracy for practical simplicity.</p>
      ${i("Hardy & Wright (1979), An Introduction to the Theory of Numbers, Ch. 10; Dershowitz & Reingold (2018)")}`,a),l("Designing a Calendar",`<p>When building a calendar for a fictional world, you need to make
        several choices:</p>
      <ul>
        <li><strong>Days per year:</strong> This comes from the planet's
            orbital period divided by its rotation period.</li>
        <li><strong>Months:</strong> If the planet has a large moon, its
            orbital period provides a natural month. Otherwise, you can
            divide the year into convenient chunks.</li>
        <li><strong>Weeks:</strong> Purely cultural -- there is no
            astronomical reason for a 7-day week. Pick a number that
            divides reasonably into your months.</li>
        <li><strong>Leap days:</strong> Unless your year is exactly a whole
            number of days (very unlikely), you will need a leap rule.</li>
        <li><strong>Intercalary days:</strong> Some calendars include
            "extra" days that belong to no week or month -- holidays,
            festivals, or year-end adjustments.</li>
      </ul>
      ${d("A good calendar divides the year into manageable, roughly equal chunks while staying aligned with astronomical reality through leap-day corrections.")}`,`<p>Calendar design is a constrained optimisation problem. The
        parameters include:</p>
      ${y(["Parameter","Source","Typical range"],[["Days per year (D)","P_orb / P_rot","10--1000+"],["Months per year (n)","Cultural or lunar","6--20"],["Days per month (d)","D / n","15--50"],["Week length (w)","Cultural","4--10"],["Leap frequency","Continued fraction of D","Varies"]])}
      <p>Optimisation criteria include:</p>
      <ul>
        <li><strong>Remainder distribution:</strong> minimise the variation
            in month lengths (ideally at most two lengths differing by
            1 day).</li>
        <li><strong>Week alignment:</strong> choose ${e("w")} so that
            ${e("d \\mod w")} is small, giving months that end near a
            week boundary.</li>
        <li><strong>Leap cycle simplicity:</strong> prefer convergents with
            small denominators (short cycles) and small numerators (few
            exceptions to remember).</li>
        <li><strong>Cultural considerations:</strong> symmetry, memorable
            rules, alignment with festivals or religious observances.</li>
      </ul>
      <p>The Bresenham-style distribution algorithm evenly spaces
        ${e("r = D - n \\cdot d_{\\min}")} long months among
        ${e("n")} months, giving the most uniform calendar possible for
        any given ${e("D")} and ${e("n")}.</p>
      ${i("Dershowitz & Reingold (2018); Richards (1998), Mapping Time: The Calendar and its History, Oxford Univ. Press")}`,a),D("Leap Cycle Finder",`${S('<label for="les17-dpy">Days per year</label>',`<input id="les17-dpy" type="number" min="10" max="1000" step="0.0001" value="365.2422">
         <input id="les17-dpySlider" type="range" min="10" max="1000" step="0.0001" value="365.2422">`)}
      ${C("les17-cycles","Best leap cycles: ")}`)].join("")}function R(a){let c=a.querySelector("#les17-dpy"),h=a.querySelector("#les17-dpySlider"),w=a.querySelector("#les17-cycles");if(!c||!h||!w)return;function E(o){let t=o-Math.floor(o);if(t<1e-4)return[{cycle:1,leapDays:0,error:t}];let r=[],k=0,m=1,$=1,g=0,f=t;for(let x=0;x<8&&r.length<3;x++){let b=Math.floor(f),v=b*m+k,n=b*g+$;if(n>0){let L=v/n,M=Math.abs(L-t)*n;r.push({cycle:n,leapDays:v,error:M})}let T=f-b;if(T<1e-10)break;f=1/T,k=m,m=v,$=g,g=n}return r}function u(){let o=parseFloat(c.value)||365.2422;h.value=o;let t=E(o);w.innerHTML=t.map(r=>`Every ${r.cycle} yr, add ${r.leapDays} leap day${r.leapDays!==1?"s":""} (error: ${_(r.error,4)} d/cycle)`).join("<br>")}c.addEventListener("input",u),h.addEventListener("input",()=>{c.value=h.value,u()}),u()}export{I as buildLesson17,R as wireLesson17};
