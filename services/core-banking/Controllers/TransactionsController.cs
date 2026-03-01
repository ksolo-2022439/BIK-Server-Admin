using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using BIK.CoreBanking.Interfaces;
using BIK.CoreBanking.DTOs;

namespace BIK.CoreBanking.Controllers
{
    [ApiController]
    [Route("BIK/v1/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpPost("deposit")]
        public async Task<IActionResult> Deposit([FromBody] SingleTransactionDto request)
        {
            try
            {
                await _transactionService.ProcessDepositAsync(request.AccountId, request.Amount);
                return Ok(new { message = "Depósito realizado con éxito." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("withdraw")]
        public async Task<IActionResult> Withdraw([FromBody] SingleTransactionDto request)
        {
            try
            {
                await _transactionService.ProcessWithdrawalAsync(request.AccountId, request.Amount);
                return Ok(new { message = "Retiro realizado con éxito." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("transfer")]
        public async Task<IActionResult> Transfer([FromBody] TransferDto request)
        {
            try
            {
                await _transactionService.ProcessTransferAsync(request.FromAccountId, request.ToAccountId, request.Amount);
                return Ok(new { message = "Transferencia realizada con éxito." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}