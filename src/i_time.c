// SONIC ROBO BLAST 2
//-----------------------------------------------------------------------------
// Copyright (C) 1993-1996 by id Software, Inc.
// Copyright (C) 1998-2000 by DooM Legacy Team.
// Copyright (C) 1999-2022 by Sonic Team Junior.
//
// This program is free software distributed under the
// terms of the GNU General Public License, version 2.
// See the 'LICENSE' file for more details.
//-----------------------------------------------------------------------------
/// \file  i_time.c
/// \brief Timing for the system layer.

#include "i_time.h"

#include <math.h>

#include "command.h"
#include "doomtype.h"
#include "d_netcmd.h"
#include "m_fixed.h"
#include "i_system.h"

timestate_t g_time;

static CV_PossibleValue_t timescale_cons_t[] = {{FRACUNIT/20, "MIN"}, {20*FRACUNIT, "MAX"}, {0, NULL}};
consvar_t cv_timescale = {"timescale", "1.0", CV_NETVAR|CV_CHEAT|CV_FLOAT, timescale_cons_t, NULL, FRACUNIT, NULL, NULL, 0, 0, NULL};

static precise_t enterprecise, oldenterprecise;
static fixed_t entertic, oldentertics;
static double tictimer;

// A little more than the minimum sleep duration on Windows.
// May be incorrect for other platforms, but we don't currently have a way to
// query the scheduler granularity. SDL will do what's needed to make this as
// low as possible though.
#define MIN_SLEEP_DURATION_MS 2.1

tic_t I_GetTime(void)
{
	return g_time.time;
}

void I_InitializeTime(void)
{
	g_time.time = 0;
	g_time.timefrac = 0;

	enterprecise = 0;
	oldenterprecise = 0;
	tictimer = 0.0;

	CV_RegisterVar(&cv_timescale);

	// I_StartupTimer is preserved for potential subsystems that need to setup
	// timing information for I_GetPreciseTime and sleeping
	I_StartupTimer();
}

void I_UpdateTime(fixed_t timescale)
{
    double ticratescaled;
    double elapsedseconds;
    tic_t realtics;

    // Guard against zero or invalid timescale
    if (timescale <= 0)
        timescale = FRACUNIT;

    ticratescaled = (double)TICRATE * FIXED_TO_FLOAT(timescale);

    enterprecise = I_GetPreciseTime();

    // First-run initialization check
    if (oldenterprecise == 0)
        oldenterprecise = enterprecise;

    elapsedseconds = (double)(enterprecise - oldenterprecise) / I_GetPrecisePrecision();

    #ifdef EMSCRIPTEN
    // Cap maximum delta time per frame to prevent giant time jumps on tab resume
    if (elapsedseconds > 0.15) {
        elapsedseconds = 0.15; // Treat tab return as a maximum ~100ms frame
    }
    #endif

    // Clamp huge deltas (e.g., browser tab unfocused or first frame start)
    if (elapsedseconds < 0.0 || elapsedseconds > 0.5)
        elapsedseconds = 1.0 / ticratescaled;

    tictimer += elapsedseconds;
    
    while (tictimer > 1.0/ticratescaled)
    {
        entertic += 1;
        tictimer -= 1.0/ticratescaled;
    }

    realtics = entertic - oldentertics;
    oldentertics = entertic;
    oldenterprecise = enterprecise;

    // Update global time state
    g_time.time += realtics;
    {
        double fractional, integral;
        fractional = modf(tictimer * ticratescaled, &integral);
        g_time.timefrac = FLOAT_TO_FIXED(fractional);
    }
}

void I_SleepDuration(precise_t duration)
{
	(void)duration;
	return;
}
